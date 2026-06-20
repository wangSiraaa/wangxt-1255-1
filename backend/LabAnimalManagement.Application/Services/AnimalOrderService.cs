using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using LabAnimalManagement.Domain.Interfaces;

namespace LabAnimalManagement.Application.Services;

public class AnimalOrderService : IAnimalOrderService
{
    private readonly IUnitOfWork _unitOfWork;

    public AnimalOrderService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<PagedResult<AnimalOrderDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var allOrders = await _unitOfWork.AnimalOrders.GetAllAsync(cancellationToken);
        var query = allOrders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
        {
            query = query.Where(o =>
                o.OrderNumber.Contains(queryParams.SearchTerm) ||
                o.Species.Contains(queryParams.SearchTerm) ||
                o.Strain.Contains(queryParams.SearchTerm));
        }

        var totalCount = query.Count();

        if (!string.IsNullOrWhiteSpace(queryParams.SortBy))
        {
            query = queryParams.SortOrder?.ToLower() == "desc"
                ? query.OrderByDescending(GetSortProperty(queryParams.SortBy))
                : query.OrderBy(GetSortProperty(queryParams.SortBy));
        }
        else
        {
            query = query.OrderByDescending(o => o.CreatedAt);
        }

        var items = query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .Select(MapToDto)
            .ToList();

        var result = new PagedResult<AnimalOrderDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize
        };

        return ApiResponse<PagedResult<AnimalOrderDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<AnimalOrderDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.AnimalOrders.GetByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("订单不存在");
        }

        return ApiResponse<AnimalOrderDto>.SuccessResult(MapToDto(order));
    }

    public async Task<ApiResponse<AnimalOrderDto>> CreateAsync(CreateAnimalOrderDto dto, CancellationToken cancellationToken = default)
    {
        var order = new AnimalOrder
        {
            Id = Guid.NewGuid(),
            ResearchGroupId = dto.ResearchGroupId,
            EthicsApprovalId = dto.EthicsApprovalId,
            Species = dto.Species,
            Strain = dto.Strain,
            Gender = dto.Gender,
            AgeWeeks = dto.AgeWeeks,
            WeightRange = dto.WeightRange,
            Quantity = dto.Quantity,
            Supplier = dto.Supplier,
            VendorLicenseNumber = dto.VendorLicenseNumber,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            Purpose = dto.Purpose,
            SpecialRequirements = dto.SpecialRequirements,
            Status = OrderStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.AnimalOrders.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<AnimalOrderDto>.SuccessResult(MapToDto(order), "创建成功");
    }

    public async Task<ApiResponse<AnimalOrderDto>> UpdateAsync(Guid id, UpdateAnimalOrderDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.AnimalOrders.GetByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("订单不存在");
        }

        if (order.Status != OrderStatus.Draft)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("只有草稿状态的订单可以修改");
        }

        order.ResearchGroupId = dto.ResearchGroupId;
        order.EthicsApprovalId = dto.EthicsApprovalId;
        order.Species = dto.Species;
        order.Strain = dto.Strain;
        order.Gender = dto.Gender;
        order.AgeWeeks = dto.AgeWeeks;
        order.WeightRange = dto.WeightRange;
        order.Quantity = dto.Quantity;
        order.Supplier = dto.Supplier;
        order.VendorLicenseNumber = dto.VendorLicenseNumber;
        order.ExpectedDeliveryDate = dto.ExpectedDeliveryDate;
        order.Purpose = dto.Purpose;
        order.SpecialRequirements = dto.SpecialRequirements;
        order.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.AnimalOrders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<AnimalOrderDto>.SuccessResult(MapToDto(order), "修改成功");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.AnimalOrders.GetByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return ApiResponse.Failure("订单不存在");
        }

        if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Rejected && order.Status != OrderStatus.Cancelled)
        {
            return ApiResponse.Failure("当前状态不允许删除");
        }

        await _unitOfWork.AnimalOrders.DeleteAsync(id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Success("删除成功");
    }

    public async Task<ApiResponse<AnimalOrderDto>> SubmitAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.AnimalOrders.GetByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("订单不存在");
        }

        if (order.Status != OrderStatus.Draft)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("只有草稿状态的订单可以提交");
        }

        var ethicsApproval = await _unitOfWork.EthicsApprovals.GetByIdAsync(order.EthicsApprovalId, cancellationToken);
        if (ethicsApproval == null)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("伦理批件不存在");
        }

        if (ethicsApproval.Status != EthicsApprovalStatus.Approved || ethicsApproval.IsExpired())
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("伦理批件已过期或未通过审批，不能提交订购");
        }

        order.OrderNumber = await GenerateOrderNumberAsync(cancellationToken);
        order.Status = OrderStatus.Submitted;
        order.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.AnimalOrders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<AnimalOrderDto>.SuccessResult(MapToDto(order), "提交成功");
    }

    public async Task<ApiResponse<AnimalOrderDto>> ApproveAsync(Guid id, ApproveOrderDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.AnimalOrders.GetByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("订单不存在");
        }

        if (order.Status != OrderStatus.Submitted)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("只有已提交状态的订单可以审批");
        }

        order.Status = OrderStatus.Approved;
        order.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.AnimalOrders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<AnimalOrderDto>.SuccessResult(MapToDto(order), "审批通过");
    }

    public async Task<ApiResponse<AnimalOrderDto>> RejectAsync(Guid id, RejectOrderDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.AnimalOrders.GetByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("订单不存在");
        }

        if (order.Status != OrderStatus.Submitted)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("只有已提交状态的订单可以拒绝");
        }

        order.Status = OrderStatus.Rejected;
        order.RejectionReason = dto.RejectionReason;
        order.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.AnimalOrders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<AnimalOrderDto>.SuccessResult(MapToDto(order), "已拒绝");
    }

    public async Task<ApiResponse<AnimalOrderDto>> MarkInTransitAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.AnimalOrders.GetByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("订单不存在");
        }

        if (order.Status != OrderStatus.Approved)
        {
            return ApiResponse<AnimalOrderDto>.FailureResult("只有已审批通过的订单可以标记为运输中");
        }

        order.Status = OrderStatus.InTransit;
        order.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.AnimalOrders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<AnimalOrderDto>.SuccessResult(MapToDto(order), "已标记为运输中");
    }

    public async Task<ApiResponse<Guid>> ReceiveAsync(Guid id, ReceiveOrderDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.AnimalOrders.GetByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return ApiResponse<Guid>.FailureResult("订单不存在");
        }

        if (order.Status != OrderStatus.InTransit)
        {
            return ApiResponse<Guid>.FailureResult("只有运输中状态的订单可以接收");
        }

        if (dto.ReceivedCount <= 0)
        {
            return ApiResponse<Guid>.FailureResult("接收数量必须大于0");
        }

        if (dto.ReceivedCount > order.Quantity)
        {
            return ApiResponse<Guid>.FailureResult("接收数量不能超过订购数量");
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            order.Status = OrderStatus.Received;
            order.ActualDeliveryDate = dto.ActualDeliveryDate;
            order.UpdatedAt = DateTime.UtcNow;

            var batch = new AnimalBatch
            {
                Id = Guid.NewGuid(),
                BatchNumber = await GenerateBatchNumberAsync(cancellationToken),
                ResearchGroupId = order.ResearchGroupId,
                AnimalOrderId = order.Id,
                Species = order.Species,
                Strain = order.Strain,
                Gender = order.Gender,
                AgeWeeks = order.AgeWeeks,
                WeightRange = order.WeightRange,
                TotalCount = dto.ReceivedCount,
                CurrentCount = dto.ReceivedCount,
                Status = BatchStatus.PendingQuarantine,
                EntryDate = dto.ActualDeliveryDate,
                Source = order.Supplier,
                CertificateNumber = dto.CertificateNumber,
                HealthStatus = dto.HealthStatus,
                Remarks = dto.Remarks,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.AnimalOrders.UpdateAsync(order, cancellationToken);
            await _unitOfWork.AnimalBatches.AddAsync(batch, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return ApiResponse<Guid>.SuccessResult(batch.Id, "接收成功，已创建动物批次");
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    private async Task<string> GenerateOrderNumberAsync(CancellationToken cancellationToken = default)
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"ORD{datePart}";

        var allOrders = await _unitOfWork.AnimalOrders.GetAllAsync(cancellationToken);
        var todayOrders = allOrders
            .Where(o => o.OrderNumber.StartsWith(prefix))
            .ToList();

        var maxSeq = 0;
        if (todayOrders.Any())
        {
            maxSeq = todayOrders
                .Select(o =>
                {
                    var seqPart = o.OrderNumber.Substring(prefix.Length);
                    return int.TryParse(seqPart, out var seq) ? seq : 0;
                })
                .Max();
        }

        var nextSeq = (maxSeq + 1).ToString("D4");
        return $"{prefix}{nextSeq}";
    }

    private async Task<string> GenerateBatchNumberAsync(CancellationToken cancellationToken = default)
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"BAT{datePart}";

        var allBatches = await _unitOfWork.AnimalBatches.GetAllAsync(cancellationToken);
        var todayBatches = allBatches
            .Where(b => b.BatchNumber.StartsWith(prefix))
            .ToList();

        var maxSeq = 0;
        if (todayBatches.Any())
        {
            maxSeq = todayBatches
                .Select(b =>
                {
                    var seqPart = b.BatchNumber.Substring(prefix.Length);
                    return int.TryParse(seqPart, out var seq) ? seq : 0;
                })
                .Max();
        }

        var nextSeq = (maxSeq + 1).ToString("D4");
        return $"{prefix}{nextSeq}";
    }

    private static Func<AnimalOrder, object> GetSortProperty(string sortBy)
    {
        return sortBy.ToLower() switch
        {
            "ordernumber" => o => o.OrderNumber,
            "status" => o => o.Status,
            "species" => o => o.Species,
            "strain" => o => o.Strain,
            "quantity" => o => o.Quantity,
            "createdat" => o => o.CreatedAt,
            _ => o => o.CreatedAt
        };
    }

    private static AnimalOrderDto MapToDto(AnimalOrder order)
    {
        return new AnimalOrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            ResearchGroupId = order.ResearchGroupId,
            ResearchGroupName = order.ResearchGroup?.GroupName,
            EthicsApprovalId = order.EthicsApprovalId,
            EthicsApprovalNumber = order.EthicsApproval?.ApprovalNumber,
            Status = order.Status,
            Species = order.Species,
            Strain = order.Strain,
            Gender = order.Gender,
            AgeWeeks = order.AgeWeeks,
            WeightRange = order.WeightRange,
            Quantity = order.Quantity,
            Supplier = order.Supplier,
            VendorLicenseNumber = order.VendorLicenseNumber,
            ExpectedDeliveryDate = order.ExpectedDeliveryDate,
            ActualDeliveryDate = order.ActualDeliveryDate,
            Purpose = order.Purpose,
            SpecialRequirements = order.SpecialRequirements,
            RejectionReason = order.RejectionReason,
            ReceivedCount = order.AnimalBatches.Sum(b => b.TotalCount),
            CreatedAt = order.CreatedAt
        };
    }
}
