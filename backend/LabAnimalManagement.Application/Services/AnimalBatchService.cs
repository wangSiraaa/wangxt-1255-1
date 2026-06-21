using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using LabAnimalManagement.Domain.Interfaces;

namespace LabAnimalManagement.Application.Services;

public class AnimalBatchService : IAnimalBatchService
{
    private readonly IUnitOfWork _unitOfWork;

    public AnimalBatchService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<PagedResult<AnimalBatchDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _unitOfWork.AnimalBatches.GetAllAsync(cancellationToken);
            var query = all.Where(x => !x.IsDeleted).AsQueryable();

            if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
            {
                query = query.Where(x =>
                    x.BatchNumber.Contains(queryParams.SearchTerm) ||
                    x.Species.Contains(queryParams.SearchTerm) ||
                    x.Strain.Contains(queryParams.SearchTerm) ||
                    (x.Source != null && x.Source.Contains(queryParams.SearchTerm)));
            }

            var totalCount = query.Count();

            if (!string.IsNullOrWhiteSpace(queryParams.SortBy))
            {
                var sortOrder = queryParams.SortOrder?.ToLower() == "desc";
                query = queryParams.SortBy.ToLower() switch
                {
                    "batchnumber" => sortOrder ? query.OrderByDescending(x => x.BatchNumber) : query.OrderBy(x => x.BatchNumber),
                    "species" => sortOrder ? query.OrderByDescending(x => x.Species) : query.OrderBy(x => x.Species),
                    "strain" => sortOrder ? query.OrderByDescending(x => x.Strain) : query.OrderBy(x => x.Strain),
                    "status" => sortOrder ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
                    "totalcount" => sortOrder ? query.OrderByDescending(x => x.TotalCount) : query.OrderBy(x => x.TotalCount),
                    "currentcount" => sortOrder ? query.OrderByDescending(x => x.CurrentCount) : query.OrderBy(x => x.CurrentCount),
                    "entrydate" => sortOrder ? query.OrderByDescending(x => x.EntryDate) : query.OrderBy(x => x.EntryDate),
                    "createdat" => sortOrder ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
                    _ => query.OrderByDescending(x => x.CreatedAt)
                };
            }
            else
            {
                query = query.OrderByDescending(x => x.CreatedAt);
            }

            var pageNumber = queryParams.PageNumber < 1 ? 1 : queryParams.PageNumber;
            var pageSize = queryParams.PageSize < 1 ? 20 : queryParams.PageSize;

            var items = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var dtos = new List<AnimalBatchDto>();
            foreach (var item in items)
            {
                dtos.Add(await MapToDto(item, cancellationToken));
            }

            var result = new PagedResult<AnimalBatchDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            return ApiResponse<PagedResult<AnimalBatchDto>>.SuccessResult(result);
        }
        catch (Exception ex)
        {
            return ApiResponse<PagedResult<AnimalBatchDto>>.FailureResult("获取批次列表失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<AnimalBatchDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.AnimalBatches.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<AnimalBatchDto>.FailureResult("批次不存在");
            }

            return ApiResponse<AnimalBatchDto>.SuccessResult(await MapToDto(entity, cancellationToken));
        }
        catch (Exception ex)
        {
            return ApiResponse<AnimalBatchDto>.FailureResult("获取批次详情失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<AnimalBatchDto>> CreateAsync(CreateAnimalBatchDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            if (dto.TotalCount <= 0)
            {
                return ApiResponse<AnimalBatchDto>.FailureResult("总数量必须大于0");
            }

            var researchGroup = await _unitOfWork.ResearchGroups.GetByIdAsync(dto.ResearchGroupId, cancellationToken);
            if (researchGroup == null || researchGroup.IsDeleted)
            {
                return ApiResponse<AnimalBatchDto>.FailureResult("课题组不存在");
            }

            if (dto.AnimalOrderId.HasValue)
            {
                var order = await _unitOfWork.AnimalOrders.GetByIdAsync(dto.AnimalOrderId.Value, cancellationToken);
                if (order == null || order.IsDeleted)
                {
                    return ApiResponse<AnimalBatchDto>.FailureResult("关联订单不存在");
                }
            }

            var entity = new AnimalBatch
            {
                Id = Guid.NewGuid(),
                BatchNumber = await GenerateBatchNumberAsync(cancellationToken),
                ResearchGroupId = dto.ResearchGroupId,
                AnimalOrderId = dto.AnimalOrderId,
                Species = dto.Species,
                Strain = dto.Strain,
                Gender = dto.Gender,
                AgeWeeks = dto.AgeWeeks,
                WeightRange = dto.WeightRange,
                TotalCount = dto.TotalCount,
                CurrentCount = dto.TotalCount,
                DeathCount = 0,
                Status = BatchStatus.PendingQuarantine,
                EntryDate = dto.EntryDate,
                ExitDate = null,
                Source = dto.Source,
                CertificateNumber = dto.CertificateNumber,
                HealthStatus = dto.HealthStatus,
                Remarks = dto.Remarks,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _unitOfWork.AnimalBatches.AddAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse<AnimalBatchDto>.SuccessResult(await MapToDto(created, cancellationToken), "创建成功");
        }
        catch (Exception ex)
        {
            return ApiResponse<AnimalBatchDto>.FailureResult("创建批次失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<AnimalBatchDto>> UpdateAsync(Guid id, UpdateAnimalBatchDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.AnimalBatches.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<AnimalBatchDto>.FailureResult("批次不存在");
            }

            entity.Source = dto.Source;
            entity.CertificateNumber = dto.CertificateNumber;
            entity.HealthStatus = dto.HealthStatus;
            entity.Remarks = dto.Remarks;
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.AnimalBatches.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse<AnimalBatchDto>.SuccessResult(await MapToDto(entity, cancellationToken), "更新成功");
        }
        catch (Exception ex)
        {
            return ApiResponse<AnimalBatchDto>.FailureResult("更新批次失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.AnimalBatches.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse.Failure("批次不存在");
            }

            if (entity.CurrentCount > 0)
            {
                return ApiResponse.Failure("批次仍有动物，不能删除");
            }

            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.AnimalBatches.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success("删除成功");
        }
        catch (Exception ex)
        {
            return ApiResponse.Failure("删除批次失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse> CloseBatchAsync(Guid batchId, CloseBatchDto dto, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var entity = await _unitOfWork.AnimalBatches.GetByIdAsync(batchId, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse.Failure("批次不存在");
            }

            if (entity.Status == BatchStatus.Closed || entity.Status == BatchStatus.Completed)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse.Failure("批次已关闭");
            }

            var deathRecords = await _unitOfWork.DeathRecords.FindAsync(
                d => d.AnimalBatchId == batchId && !d.IsDeleted, cancellationToken);

            var abnormalDeathRecords = deathRecords
                .Where(d => d.DeathType == DeathType.Abnormal)
                .ToList();

            var abnormalWithoutInvestigation = abnormalDeathRecords
                .Where(d => !d.InvestigationId.HasValue)
                .ToList();

            if (abnormalWithoutInvestigation.Any())
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse.Failure($"存在 {abnormalWithoutInvestigation.Count} 条异常死亡记录未创建调查，不能关闭批次");
            }

            var investigationIds = abnormalDeathRecords
                .Where(d => d.InvestigationId.HasValue)
                .Select(d => d.InvestigationId!.Value)
                .Distinct()
                .ToList();

            if (investigationIds.Any())
            {
                var allInvestigations = await _unitOfWork.DeathInvestigations.GetAllAsync(cancellationToken);
                var pendingInvestigations = allInvestigations
                    .Where(i => investigationIds.Contains(i.Id))
                    .Any(i => i.Status != InvestigationStatus.Completed
                            && i.Status != InvestigationStatus.Closed);

                if (pendingInvestigations)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    return ApiResponse.Failure("存在未完成调查的异常死亡记录，不能关闭批次");
                }
            }

            if (entity.CurrentCount != 0)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse.Failure("批次当前动物数不为0，不能关闭");
            }

            entity.Status = BatchStatus.Closed;
            entity.ExitDate = DateTime.UtcNow;
            entity.Remarks = string.IsNullOrWhiteSpace(dto.Remarks) ? entity.Remarks : dto.Remarks;
            entity.UpdatedAt = DateTime.UtcNow;

            var activeAllocations = await _unitOfWork.CageAllocations.FindAsync(
                a => a.AnimalBatchId == batchId && a.IsActive && !a.IsDeleted, cancellationToken);

            foreach (var alloc in activeAllocations)
            {
                var cage = await _unitOfWork.CageLocations.GetByIdAsync(alloc.CageLocationId, cancellationToken);
                if (cage != null && !cage.IsDeleted)
                {
                    cage.CurrentOccupancy = Math.Max(0, cage.CurrentOccupancy - alloc.AnimalCount);
                    if (cage.CurrentOccupancy == 0)
                    {
                        cage.Status = CageStatus.Available;
                    }
                    cage.UpdatedAt = DateTime.UtcNow;
                    await _unitOfWork.CageLocations.UpdateAsync(cage, cancellationToken);
                }

                alloc.IsActive = false;
                alloc.ReleaseDate = DateTime.UtcNow;
                alloc.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.CageAllocations.UpdateAsync(alloc, cancellationToken);
            }

            await _unitOfWork.AnimalBatches.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return ApiResponse.Success("批次已关闭");
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            return ApiResponse.Failure("关闭批次失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<List<AnimalBatchDto>>> GetByResearchGroupIdAsync(Guid researchGroupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _unitOfWork.AnimalBatches.GetAllAsync(cancellationToken);
            var batches = all
                .Where(x => !x.IsDeleted && x.ResearchGroupId == researchGroupId)
                .OrderByDescending(x => x.CreatedAt)
                .ToList();

            var dtos = new List<AnimalBatchDto>();
            foreach (var b in batches)
            {
                dtos.Add(await MapToDto(b, cancellationToken));
            }

            return ApiResponse<List<AnimalBatchDto>>.SuccessResult(dtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<List<AnimalBatchDto>>.FailureResult("查询课题组批次失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<List<AnimalBatchDto>>> GetActiveBatchesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _unitOfWork.AnimalBatches.GetAllAsync(cancellationToken);
            var batches = all
                .Where(x => !x.IsDeleted
                    && x.Status != BatchStatus.Closed
                    && x.Status != BatchStatus.Completed)
                .OrderByDescending(x => x.CreatedAt)
                .ToList();

            var dtos = new List<AnimalBatchDto>();
            foreach (var b in batches)
            {
                dtos.Add(await MapToDto(b, cancellationToken));
            }

            return ApiResponse<List<AnimalBatchDto>>.SuccessResult(dtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<List<AnimalBatchDto>>.FailureResult("查询活跃批次失败", new List<string> { ex.Message });
        }
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

    private async Task<bool> CanCloseBatchAsync(AnimalBatch batch, CancellationToken cancellationToken = default)
    {
        if (batch.CurrentCount != 0)
        {
            return false;
        }

        var deathRecords = await _unitOfWork.DeathRecords.FindAsync(
            d => d.AnimalBatchId == batch.Id && !d.IsDeleted, cancellationToken);

        var abnormalDeathRecords = deathRecords
            .Where(d => d.DeathType == DeathType.Abnormal)
            .ToList();

        if (abnormalDeathRecords.Any(d => !d.InvestigationId.HasValue))
        {
            return false;
        }

        var investigationIds = abnormalDeathRecords
            .Where(d => d.InvestigationId.HasValue)
            .Select(d => d.InvestigationId!.Value)
            .Distinct()
            .ToList();

        if (investigationIds.Any())
        {
            var allInvestigations = await _unitOfWork.DeathInvestigations.GetAllAsync(cancellationToken);
            var hasPending = allInvestigations
                .Where(i => investigationIds.Contains(i.Id))
                .Any(i => i.Status != InvestigationStatus.Completed
                        && i.Status != InvestigationStatus.Closed);

            if (hasPending)
            {
                return false;
            }
        }

        return true;
    }

    private async Task<int> GetCageOccupancyCountAsync(Guid batchId, CancellationToken cancellationToken = default)
    {
        var allocations = await _unitOfWork.CageAllocations.FindAsync(
            a => a.AnimalBatchId == batchId && a.IsActive && !a.IsDeleted, cancellationToken);
        return allocations.Sum(a => a.AnimalCount);
    }

    private async Task<AnimalBatchDto> MapToDto(AnimalBatch entity, CancellationToken cancellationToken = default)
    {
        var researchGroup = await _unitOfWork.ResearchGroups.GetByIdAsync(entity.ResearchGroupId, cancellationToken);
        AnimalOrder? order = null;
        if (entity.AnimalOrderId.HasValue)
        {
            order = await _unitOfWork.AnimalOrders.GetByIdAsync(entity.AnimalOrderId.Value, cancellationToken);
        }

        return new AnimalBatchDto
        {
            Id = entity.Id,
            BatchNumber = entity.BatchNumber,
            ResearchGroupId = entity.ResearchGroupId,
            ResearchGroupName = researchGroup?.GroupName,
            AnimalOrderId = entity.AnimalOrderId,
            OrderNumber = order?.OrderNumber,
            Status = entity.Status,
            Species = entity.Species,
            Strain = entity.Strain,
            Gender = entity.Gender,
            AgeWeeks = entity.AgeWeeks,
            WeightRange = entity.WeightRange,
            TotalCount = entity.TotalCount,
            CurrentCount = entity.CurrentCount,
            DeathCount = entity.DeathCount,
            EntryDate = entity.EntryDate,
            ExitDate = entity.ExitDate,
            Source = entity.Source,
            CertificateNumber = entity.CertificateNumber,
            HealthStatus = entity.HealthStatus,
            Remarks = entity.Remarks,
            CanClose = await CanCloseBatchAsync(entity, cancellationToken),
            CageOccupancyCount = await GetCageOccupancyCountAsync(entity.Id, cancellationToken)
        };
    }
}
