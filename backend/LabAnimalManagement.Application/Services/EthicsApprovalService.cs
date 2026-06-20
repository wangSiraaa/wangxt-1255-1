using AutoMapper;
using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using LabAnimalManagement.Domain.Interfaces;

namespace LabAnimalManagement.Application.Services;

public class EthicsApprovalService : IEthicsApprovalService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public EthicsApprovalService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<EthicsApprovalDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.EthicsApprovals.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<EthicsApprovalDto>.FailureResult("伦理批件不存在");
            }

            var usedCount = await CalculateUsedAnimalCountAsync(id, cancellationToken);
            var dto = MapToDto(entity, usedCount);
            return ApiResponse<EthicsApprovalDto>.SuccessResult(dto);
        }
        catch (Exception ex)
        {
            return ApiResponse<EthicsApprovalDto>.FailureResult("获取伦理批件详情失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<PagedResult<EthicsApprovalDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        try
        {
            var allEntities = await _unitOfWork.EthicsApprovals.GetAllAsync(cancellationToken);
            var query = allEntities.Where(e => !e.IsDeleted).AsQueryable();

            if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
            {
                var search = queryParams.SearchTerm.Trim().ToLower();
                query = query.Where(e =>
                    e.ApprovalNumber.ToLower().Contains(search) ||
                    e.Title.ToLower().Contains(search));
            }

            var totalCount = query.Count();

            if (!string.IsNullOrWhiteSpace(queryParams.SortBy))
            {
                var descending = queryParams.SortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) == true;
                query = queryParams.SortBy.ToLower() switch
                {
                    "approvalnumber" => descending ? query.OrderByDescending(e => e.ApprovalNumber) : query.OrderBy(e => e.ApprovalNumber),
                    "approvaldate" => descending ? query.OrderByDescending(e => e.ApprovalDate) : query.OrderBy(e => e.ApprovalDate),
                    "expirydate" => descending ? query.OrderByDescending(e => e.ExpiryDate) : query.OrderBy(e => e.ExpiryDate),
                    "status" => descending ? query.OrderByDescending(e => e.Status) : query.OrderBy(e => e.Status),
                    _ => query.OrderByDescending(e => e.CreatedAt)
                };
            }
            else
            {
                query = query.OrderByDescending(e => e.CreatedAt);
            }

            var pageNumber = queryParams.PageNumber < 1 ? 1 : queryParams.PageNumber;
            var pageSize = queryParams.PageSize < 1 ? 20 : queryParams.PageSize;

            var pagedEntities = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var dtos = new List<EthicsApprovalDto>();
            foreach (var entity in pagedEntities)
            {
                var usedCount = await CalculateUsedAnimalCountAsync(entity.Id, cancellationToken);
                dtos.Add(MapToDto(entity, usedCount));
            }

            var result = new PagedResult<EthicsApprovalDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            return ApiResponse<PagedResult<EthicsApprovalDto>>.SuccessResult(result);
        }
        catch (Exception ex)
        {
            return ApiResponse<PagedResult<EthicsApprovalDto>>.FailureResult("获取伦理批件列表失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<EthicsApprovalDto>>> GetByResearchGroupIdAsync(Guid researchGroupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var entities = await _unitOfWork.EthicsApprovals.FindAsync(
                e => e.ResearchGroupId == researchGroupId && !e.IsDeleted,
                cancellationToken);

            var dtos = new List<EthicsApprovalDto>();
            foreach (var entity in entities)
            {
                var usedCount = await CalculateUsedAnimalCountAsync(entity.Id, cancellationToken);
                dtos.Add(MapToDto(entity, usedCount));
            }

            return ApiResponse<IEnumerable<EthicsApprovalDto>>.SuccessResult(dtos.OrderByDescending(e => e.CreatedAt));
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<EthicsApprovalDto>>.FailureResult("获取课题组伦理批件失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<EthicsApprovalDto>> CreateAsync(CreateEthicsApprovalDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var existing = await _unitOfWork.EthicsApprovals.FindAsync(
                e => e.ApprovalNumber == dto.ApprovalNumber && !e.IsDeleted,
                cancellationToken);
            if (existing.Any())
            {
                return ApiResponse<EthicsApprovalDto>.FailureResult("批件编号已存在");
            }

            if (dto.ExpiryDate <= dto.ApprovalDate)
            {
                return ApiResponse<EthicsApprovalDto>.FailureResult("有效期截止日期必须晚于批准日期");
            }

            var entity = new EthicsApproval
            {
                Id = Guid.NewGuid(),
                ApprovalNumber = dto.ApprovalNumber,
                ResearchGroupId = dto.ResearchGroupId,
                Title = dto.Title,
                ApprovalDate = dto.ApprovalDate,
                ExpiryDate = dto.ExpiryDate,
                Status = dto.Status,
                ApprovedBy = dto.ApprovedBy,
                MaxAnimalCount = dto.MaxAnimalCount,
                SpeciesAllowed = dto.SpeciesAllowed,
                Remarks = dto.Remarks,
                ApprovalDocumentPath = dto.ApprovalDocumentPath,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.EthicsApprovals.AddAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse<EthicsApprovalDto>.SuccessResult(MapToDto(entity, 0), "创建成功");
        }
        catch (Exception ex)
        {
            return ApiResponse<EthicsApprovalDto>.FailureResult("创建伦理批件失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<EthicsApprovalDto>> UpdateAsync(Guid id, UpdateEthicsApprovalDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.EthicsApprovals.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<EthicsApprovalDto>.FailureResult("伦理批件不存在");
            }

            var existing = await _unitOfWork.EthicsApprovals.FindAsync(
                e => e.ApprovalNumber == dto.ApprovalNumber && e.Id != id && !e.IsDeleted,
                cancellationToken);
            if (existing.Any())
            {
                return ApiResponse<EthicsApprovalDto>.FailureResult("批件编号已存在");
            }

            if (dto.ExpiryDate <= dto.ApprovalDate)
            {
                return ApiResponse<EthicsApprovalDto>.FailureResult("有效期截止日期必须晚于批准日期");
            }

            entity.ApprovalNumber = dto.ApprovalNumber;
            entity.ResearchGroupId = dto.ResearchGroupId;
            entity.Title = dto.Title;
            entity.ApprovalDate = dto.ApprovalDate;
            entity.ExpiryDate = dto.ExpiryDate;
            entity.Status = dto.Status;
            entity.ApprovedBy = dto.ApprovedBy;
            entity.MaxAnimalCount = dto.MaxAnimalCount;
            entity.SpeciesAllowed = dto.SpeciesAllowed;
            entity.Remarks = dto.Remarks;
            entity.ApprovalDocumentPath = dto.ApprovalDocumentPath;
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.EthicsApprovals.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var usedCount = await CalculateUsedAnimalCountAsync(id, cancellationToken);
            return ApiResponse<EthicsApprovalDto>.SuccessResult(MapToDto(entity, usedCount), "更新成功");
        }
        catch (Exception ex)
        {
            return ApiResponse<EthicsApprovalDto>.FailureResult("更新伦理批件失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.EthicsApprovals.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse.Failure("伦理批件不存在");
            }

            var orders = await _unitOfWork.AnimalOrders.FindAsync(
                o => o.EthicsApprovalId == id && !o.IsDeleted,
                cancellationToken);
            if (orders.Any())
            {
                return ApiResponse.Failure("该伦理批件已关联动物订单，无法删除");
            }

            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.EthicsApprovals.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success("删除成功");
        }
        catch (Exception ex)
        {
            return ApiResponse.Failure("删除伦理批件失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> CheckValidityAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.EthicsApprovals.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<bool>.FailureResult("伦理批件不存在");
            }

            bool isValid = entity.Status == EthicsApprovalStatus.Approved
                           && DateTime.Now >= entity.ApprovalDate
                           && DateTime.Now <= entity.ExpiryDate;

            return ApiResponse<bool>.SuccessResult(isValid);
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.FailureResult("检查伦理批件有效性失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<int>> GetUsedAnimalCountAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.EthicsApprovals.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<int>.FailureResult("伦理批件不存在");
            }

            var usedCount = await CalculateUsedAnimalCountAsync(id, cancellationToken);
            return ApiResponse<int>.SuccessResult(usedCount);
        }
        catch (Exception ex)
        {
            return ApiResponse<int>.FailureResult("获取已使用动物数失败", new List<string> { ex.Message });
        }
    }

    private async Task<int> CalculateUsedAnimalCountAsync(Guid ethicsApprovalId, CancellationToken cancellationToken)
    {
        var orders = await _unitOfWork.AnimalOrders.FindAsync(
            o => o.EthicsApprovalId == ethicsApprovalId
                 && o.Status == OrderStatus.Received
                 && !o.IsDeleted,
            cancellationToken);

        return orders.Sum(o => o.Quantity);
    }

    private static EthicsApprovalDto MapToDto(EthicsApproval entity, int usedCount)
    {
        return new EthicsApprovalDto
        {
            Id = entity.Id,
            ApprovalNumber = entity.ApprovalNumber,
            ResearchGroupId = entity.ResearchGroupId,
            ResearchGroupName = entity.ResearchGroup?.GroupName,
            Title = entity.Title,
            ApprovalDate = entity.ApprovalDate,
            ExpiryDate = entity.ExpiryDate,
            Status = entity.Status,
            ApprovedBy = entity.ApprovedBy,
            MaxAnimalCount = entity.MaxAnimalCount,
            UsedAnimalCount = usedCount,
            SpeciesAllowed = entity.SpeciesAllowed,
            Remarks = entity.Remarks,
            IsExpired = DateTime.Now > entity.ExpiryDate,
            IsValid = entity.Status == EthicsApprovalStatus.Approved
                      && DateTime.Now >= entity.ApprovalDate
                      && DateTime.Now <= entity.ExpiryDate
        };
    }
}
