using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using LabAnimalManagement.Domain.Interfaces;

namespace LabAnimalManagement.Application.Services;

public class DeathRecordService : IDeathRecordService
{
    private readonly IUnitOfWork _unitOfWork;

    public DeathRecordService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<DeathRecordDto>> CreateAsync(CreateDeathRecordDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.DeathCount <= 0)
        {
            return ApiResponse<DeathRecordDto>.FailureResult("死亡数量必须大于0");
        }

        var batch = await _unitOfWork.AnimalBatches.GetByIdAsync(dto.AnimalBatchId, cancellationToken);
        if (batch == null || batch.IsDeleted)
        {
            return ApiResponse<DeathRecordDto>.FailureResult("动物批次不存在");
        }

        if (dto.DeathCount > batch.CurrentCount)
        {
            return ApiResponse<DeathRecordDto>.FailureResult($"死亡数量不能超过批次当前存活数量({batch.CurrentCount})");
        }

        Animal? animal = null;
        if (dto.AnimalId.HasValue)
        {
            animal = await _unitOfWork.Animals.GetByIdAsync(dto.AnimalId.Value, cancellationToken);
            if (animal == null || animal.IsDeleted)
            {
                return ApiResponse<DeathRecordDto>.FailureResult("指定的动物不存在");
            }
            if (animal.AnimalBatchId != dto.AnimalBatchId)
            {
                return ApiResponse<DeathRecordDto>.FailureResult("指定动物不属于该批次");
            }
            if (!animal.IsAlive)
            {
                return ApiResponse<DeathRecordDto>.FailureResult("该动物已死亡");
            }
            if (dto.DeathCount != 1)
            {
                return ApiResponse<DeathRecordDto>.FailureResult("指定具体动物时死亡数量必须为1");
            }
        }

        var recordNumber = await GenerateRecordNumberAsync(cancellationToken);

        var entity = new DeathRecord
        {
            Id = Guid.NewGuid(),
            RecordNumber = recordNumber,
            AnimalBatchId = dto.AnimalBatchId,
            AnimalId = dto.AnimalId,
            DeathType = dto.DeathType,
            DeathDate = dto.DeathDate,
            DeathCount = dto.DeathCount,
            ReportedBy = dto.ReportedBy,
            ReportedDate = DateTime.UtcNow,
            SuspectedCause = dto.SuspectedCause,
            ClinicalSigns = dto.ClinicalSigns,
            NecropsyPerformed = dto.NecropsyPerformed,
            NecropsyFindings = dto.NecropsyFindings,
            LabResults = dto.LabResults,
            DisposalMethod = dto.DisposalMethod,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await _unitOfWork.DeathRecords.AddAsync(entity, cancellationToken);

            batch.DeathCount += dto.DeathCount;
            batch.CurrentCount -= dto.DeathCount;
            batch.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.AnimalBatches.UpdateAsync(batch, cancellationToken);

            if (animal != null)
            {
                animal.IsAlive = false;
                animal.DeathDate = dto.DeathDate;
                animal.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.Animals.UpdateAsync(animal, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        var warnings = new List<string>();
        if (dto.DeathType == DeathType.Abnormal)
        {
            warnings.Add("异常死亡，建议启动死亡调查流程");
        }

        var resultDto = await MapToDto(entity, cancellationToken);
        var response = ApiResponse<DeathRecordDto>.SuccessResult(resultDto, "死亡记录创建成功");
        if (warnings.Any())
        {
            response.Errors = warnings;
        }
        return response;
    }

    public async Task<ApiResponse<DeathRecordDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.DeathRecords.GetByIdAsync(id, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse<DeathRecordDto>.FailureResult("死亡记录不存在");
        }

        return ApiResponse<DeathRecordDto>.SuccessResult(await MapToDto(entity, cancellationToken));
    }

    public async Task<ApiResponse<PagedResult<DeathRecordDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var allEntities = await _unitOfWork.DeathRecords.GetAllAsync(cancellationToken);
        var query = allEntities.Where(e => !e.IsDeleted).AsQueryable();

        if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
        {
            var search = queryParams.SearchTerm.Trim().ToLower();
            query = query.Where(e =>
                e.RecordNumber.ToLower().Contains(search) ||
                (e.AnimalBatch != null && e.AnimalBatch.BatchNumber.ToLower().Contains(search)));
        }

        var totalCount = query.Count();

        if (!string.IsNullOrWhiteSpace(queryParams.SortBy))
        {
            var descending = queryParams.SortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) == true;
            query = queryParams.SortBy.ToLower() switch
            {
                "recordnumber" => descending ? query.OrderByDescending(e => e.RecordNumber) : query.OrderBy(e => e.RecordNumber),
                "deathdate" => descending ? query.OrderByDescending(e => e.DeathDate) : query.OrderBy(e => e.DeathDate),
                "deathtype" => descending ? query.OrderByDescending(e => e.DeathType) : query.OrderBy(e => e.DeathType),
                "deathcount" => descending ? query.OrderByDescending(e => e.DeathCount) : query.OrderBy(e => e.DeathCount),
                _ => query.OrderByDescending(e => e.CreatedAt)
            };
        }
        else
        {
            query = query.OrderByDescending(e => e.CreatedAt);
        }

        var pagedEntities = query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToList();

        var dtos = new List<DeathRecordDto>();
        foreach (var entity in pagedEntities)
        {
            dtos.Add(await MapToDto(entity, cancellationToken));
        }

        var result = new PagedResult<DeathRecordDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize
        };

        return ApiResponse<PagedResult<DeathRecordDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<IEnumerable<DeathRecordDto>>> GetByBatchIdAsync(Guid batchId, CancellationToken cancellationToken = default)
    {
        var entities = await _unitOfWork.DeathRecords.FindAsync(
            e => e.AnimalBatchId == batchId && !e.IsDeleted,
            cancellationToken);

        var dtos = new List<DeathRecordDto>();
        foreach (var entity in entities.OrderByDescending(e => e.DeathDate))
        {
            dtos.Add(await MapToDto(entity, cancellationToken));
        }

        return ApiResponse<IEnumerable<DeathRecordDto>>.SuccessResult(dtos);
    }

    public async Task<ApiResponse<IEnumerable<DeathRecordDto>>> GetAbnormalDeathsAsync(CancellationToken cancellationToken = default)
    {
        var allEntities = await _unitOfWork.DeathRecords.GetAllAsync(cancellationToken);
        var entities = allEntities.Where(e =>
            !e.IsDeleted &&
            e.DeathType == DeathType.Abnormal &&
            (e.Investigation == null ||
             (e.Investigation.Status != InvestigationStatus.Completed &&
              e.Investigation.Status != InvestigationStatus.Closed)))
            .OrderByDescending(e => e.DeathDate)
            .ToList();

        var dtos = new List<DeathRecordDto>();
        foreach (var entity in entities)
        {
            dtos.Add(await MapToDto(entity, cancellationToken));
        }

        return ApiResponse<IEnumerable<DeathRecordDto>>.SuccessResult(dtos);
    }

    public async Task<ApiResponse<DeathRecordDto>> UpdateAsync(Guid id, UpdateDeathRecordDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.DeathRecords.GetByIdAsync(id, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse<DeathRecordDto>.FailureResult("死亡记录不存在");
        }

        entity.DeathType = dto.DeathType;
        entity.SuspectedCause = dto.SuspectedCause;
        entity.ClinicalSigns = dto.ClinicalSigns;
        entity.NecropsyPerformed = dto.NecropsyPerformed;
        entity.NecropsyFindings = dto.NecropsyFindings;
        entity.LabResults = dto.LabResults;
        entity.DisposalMethod = dto.DisposalMethod;
        entity.Remarks = dto.Remarks;
        entity.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.DeathRecords.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<DeathRecordDto>.SuccessResult(await MapToDto(entity, cancellationToken), "更新成功");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.DeathRecords.GetByIdAsync(id, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse.Failure("死亡记录不存在");
        }

        if (entity.InvestigationId.HasValue)
        {
            return ApiResponse.Failure("该死亡记录已关联死亡调查，无法删除");
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var batch = await _unitOfWork.AnimalBatches.GetByIdAsync(entity.AnimalBatchId, cancellationToken);
            if (batch != null && !batch.IsDeleted)
            {
                batch.DeathCount -= entity.DeathCount;
                batch.CurrentCount += entity.DeathCount;
                if (batch.DeathCount < 0) batch.DeathCount = 0;
                batch.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.AnimalBatches.UpdateAsync(batch, cancellationToken);
            }

            if (entity.AnimalId.HasValue)
            {
                var animal = await _unitOfWork.Animals.GetByIdAsync(entity.AnimalId.Value, cancellationToken);
                if (animal != null && !animal.IsDeleted)
                {
                    animal.IsAlive = true;
                    animal.DeathDate = null;
                    animal.UpdatedAt = DateTime.UtcNow;
                    await _unitOfWork.Animals.UpdateAsync(animal, cancellationToken);
                }
            }

            await _unitOfWork.DeathRecords.DeleteAsync(id, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return ApiResponse.Success("删除成功");
    }

    private async Task<string> GenerateRecordNumberAsync(CancellationToken cancellationToken)
    {
        var dateStr = DateTime.Now.ToString("yyyyMMdd");
        var prefix = $"DR{dateStr}";

        var todayRecords = await _unitOfWork.DeathRecords.FindAsync(
            r => r.RecordNumber.StartsWith(prefix),
            cancellationToken);

        var maxSeq = 0;
        foreach (var r in todayRecords)
        {
            var seqStr = r.RecordNumber.Substring(prefix.Length);
            if (int.TryParse(seqStr, out var seq) && seq > maxSeq)
            {
                maxSeq = seq;
            }
        }

        return $"{prefix}{(maxSeq + 1).ToString("D4")}";
    }

    private async Task<DeathRecordDto> MapToDto(DeathRecord entity, CancellationToken cancellationToken)
    {
        var batchNumber = string.Empty;
        var animalNumber = string.Empty;
        string? investigationNumber = null;
        InvestigationStatus? investigationStatus = null;

        if (entity.AnimalBatch != null)
        {
            batchNumber = entity.AnimalBatch.BatchNumber;
        }
        else
        {
            var batch = await _unitOfWork.AnimalBatches.GetByIdAsync(entity.AnimalBatchId, cancellationToken);
            if (batch != null && !batch.IsDeleted)
            {
                batchNumber = batch.BatchNumber;
            }
        }

        if (entity.AnimalId.HasValue)
        {
            if (entity.Animal != null)
            {
                animalNumber = entity.Animal.AnimalNumber;
            }
            else
            {
                var animal = await _unitOfWork.Animals.GetByIdAsync(entity.AnimalId.Value, cancellationToken);
                if (animal != null && !animal.IsDeleted)
                {
                    animalNumber = animal.AnimalNumber;
                }
            }
        }

        if (entity.InvestigationId.HasValue)
        {
            if (entity.Investigation != null)
            {
                investigationNumber = entity.Investigation.InvestigationNumber;
                investigationStatus = entity.Investigation.Status;
            }
            else
            {
                var investigation = await _unitOfWork.DeathInvestigations.GetByIdAsync(entity.InvestigationId.Value, cancellationToken);
                if (investigation != null && !investigation.IsDeleted)
                {
                    investigationNumber = investigation.InvestigationNumber;
                    investigationStatus = investigation.Status;
                }
            }
        }

        return new DeathRecordDto
        {
            Id = entity.Id,
            RecordNumber = entity.RecordNumber,
            AnimalBatchId = entity.AnimalBatchId,
            BatchNumber = batchNumber,
            AnimalId = entity.AnimalId,
            AnimalNumber = animalNumber,
            DeathType = entity.DeathType,
            DeathDate = entity.DeathDate,
            DeathCount = entity.DeathCount,
            ReportedBy = entity.ReportedBy,
            ReportedDate = entity.ReportedDate,
            SuspectedCause = entity.SuspectedCause,
            ClinicalSigns = entity.ClinicalSigns,
            NecropsyPerformed = entity.NecropsyPerformed,
            NecropsyFindings = entity.NecropsyFindings,
            LabResults = entity.LabResults,
            DisposalMethod = entity.DisposalMethod,
            Remarks = entity.Remarks,
            InvestigationId = entity.InvestigationId,
            InvestigationNumber = investigationNumber,
            InvestigationStatus = investigationStatus
        };
    }
}
