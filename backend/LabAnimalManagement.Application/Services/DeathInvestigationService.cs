using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using LabAnimalManagement.Domain.Interfaces;

namespace LabAnimalManagement.Application.Services;

public class DeathInvestigationService : IDeathInvestigationService
{
    private readonly IUnitOfWork _unitOfWork;

    public DeathInvestigationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<DeathInvestigationDto>> CreateAsync(CreateDeathInvestigationDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.DeathRecordIds == null || !dto.DeathRecordIds.Any())
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("必须至少关联一条死亡记录");
        }

        var deathRecords = new List<DeathRecord>();
        var batchIds = new HashSet<Guid>();
        foreach (var deathRecordId in dto.DeathRecordIds.Distinct())
        {
            var deathRecord = await _unitOfWork.DeathRecords.GetByIdAsync(deathRecordId, cancellationToken);
            if (deathRecord == null || deathRecord.IsDeleted)
            {
                return ApiResponse<DeathInvestigationDto>.FailureResult($"死亡记录 {deathRecordId} 不存在");
            }
            if (deathRecord.InvestigationId.HasValue)
            {
                return ApiResponse<DeathInvestigationDto>.FailureResult($"死亡记录 {deathRecord.RecordNumber} 已关联调查");
            }
            deathRecords.Add(deathRecord);
            batchIds.Add(deathRecord.AnimalBatchId);
        }

        var investigationNumber = await GenerateInvestigationNumberAsync(cancellationToken);

        var entity = new DeathInvestigation
        {
            Id = Guid.NewGuid(),
            InvestigationNumber = investigationNumber,
            Status = InvestigationStatus.Pending,
            StartDate = DateTime.UtcNow,
            InvestigatorId = dto.InvestigatorId,
            InvestigatorName = dto.InvestigatorName,
            TeamMembers = dto.TeamMembers,
            Background = dto.Background,
            InvestigationMethod = dto.InvestigationMethod,
            FollowUpDate = dto.FollowUpDate,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var deathRecord in deathRecords)
        {
            deathRecord.InvestigationId = entity.Id;
            deathRecord.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.DeathRecords.UpdateAsync(deathRecord, cancellationToken);
        }

        await _unitOfWork.DeathInvestigations.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<DeathInvestigationDto>.SuccessResult(await MapToDto(entity, cancellationToken), "调查创建成功");
    }

    public async Task<ApiResponse<DeathInvestigationDto>> CompleteAsync(Guid investigationId, CompleteInvestigationDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.DeathInvestigations.GetByIdAsync(investigationId, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("死亡调查不存在");
        }

        if (entity.Status == InvestigationStatus.Completed || entity.Status == InvestigationStatus.Closed)
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("该调查已完成或已关闭");
        }

        if (string.IsNullOrWhiteSpace(dto.Findings))
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("调查发现不能为空");
        }

        if (string.IsNullOrWhiteSpace(dto.RootCause))
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("根本原因不能为空");
        }

        if (string.IsNullOrWhiteSpace(dto.Conclusion))
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("调查结论不能为空");
        }

        entity.Status = InvestigationStatus.Completed;
        entity.CompletedDate = dto.CompletedDate;
        entity.Findings = dto.Findings;
        entity.RootCause = dto.RootCause;
        entity.CorrectiveActions = dto.CorrectiveActions;
        entity.PreventiveMeasures = dto.PreventiveMeasures;
        entity.Conclusion = dto.Conclusion;
        entity.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.DeathInvestigations.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<DeathInvestigationDto>.SuccessResult(await MapToDto(entity, cancellationToken), "调查完成");
    }

    public async Task<ApiResponse<DeathInvestigationDto>> CloseAsync(Guid investigationId, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.DeathInvestigations.GetByIdAsync(investigationId, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("死亡调查不存在");
        }

        if (entity.Status == InvestigationStatus.Closed)
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("该调查已关闭");
        }

        entity.Status = InvestigationStatus.Closed;
        entity.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.DeathInvestigations.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<DeathInvestigationDto>.SuccessResult(await MapToDto(entity, cancellationToken), "调查已关闭");
    }

    public async Task<ApiResponse<DeathInvestigationDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.DeathInvestigations.GetByIdAsync(id, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("死亡调查不存在");
        }

        return ApiResponse<DeathInvestigationDto>.SuccessResult(await MapToDto(entity, cancellationToken));
    }

    public async Task<ApiResponse<PagedResult<DeathInvestigationDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var allEntities = await _unitOfWork.DeathInvestigations.GetAllAsync(cancellationToken);
        var query = allEntities.Where(e => !e.IsDeleted).AsQueryable();

        if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
        {
            var search = queryParams.SearchTerm.Trim().ToLower();
            query = query.Where(e =>
                e.InvestigationNumber.ToLower().Contains(search) ||
                (e.Background != null && e.Background.ToLower().Contains(search)));
        }

        var totalCount = query.Count();

        if (!string.IsNullOrWhiteSpace(queryParams.SortBy))
        {
            var descending = queryParams.SortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) == true;
            query = queryParams.SortBy.ToLower() switch
            {
                "investigationnumber" => descending ? query.OrderByDescending(e => e.InvestigationNumber) : query.OrderBy(e => e.InvestigationNumber),
                "startdate" => descending ? query.OrderByDescending(e => e.StartDate) : query.OrderBy(e => e.StartDate),
                "status" => descending ? query.OrderByDescending(e => e.Status) : query.OrderBy(e => e.Status),
                "completeddate" => descending ? query.OrderByDescending(e => e.CompletedDate) : query.OrderBy(e => e.CompletedDate),
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

        var dtos = new List<DeathInvestigationDto>();
        foreach (var entity in pagedEntities)
        {
            dtos.Add(await MapToDto(entity, cancellationToken));
        }

        var result = new PagedResult<DeathInvestigationDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize
        };

        return ApiResponse<PagedResult<DeathInvestigationDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<IEnumerable<DeathInvestigationDto>>> GetByBatchIdAsync(Guid batchId, CancellationToken cancellationToken = default)
    {
        var allInvestigations = await _unitOfWork.DeathInvestigations.GetAllAsync(cancellationToken);
        var entities = allInvestigations
            .Where(i => !i.IsDeleted && i.DeathRecords.Any(d => d.AnimalBatchId == batchId))
            .OrderByDescending(e => e.CreatedAt)
            .ToList();

        var dtos = new List<DeathInvestigationDto>();
        foreach (var entity in entities)
        {
            dtos.Add(await MapToDto(entity, cancellationToken));
        }

        return ApiResponse<IEnumerable<DeathInvestigationDto>>.SuccessResult(dtos);
    }

    public async Task<ApiResponse<DeathInvestigationDto>> UpdateAsync(Guid id, UpdateDeathInvestigationDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.DeathInvestigations.GetByIdAsync(id, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("死亡调查不存在");
        }

        if (entity.Status == InvestigationStatus.Closed)
        {
            return ApiResponse<DeathInvestigationDto>.FailureResult("已关闭的调查不能修改");
        }

        entity.Status = dto.Status;
        entity.InvestigatorId = dto.InvestigatorId;
        entity.InvestigatorName = dto.InvestigatorName;
        entity.TeamMembers = dto.TeamMembers;
        entity.Background = dto.Background;
        entity.InvestigationMethod = dto.InvestigationMethod;
        entity.Findings = dto.Findings;
        entity.RootCause = dto.RootCause;
        entity.CorrectiveActions = dto.CorrectiveActions;
        entity.PreventiveMeasures = dto.PreventiveMeasures;
        entity.Conclusion = dto.Conclusion;
        entity.Remarks = dto.Remarks;
        entity.FollowUpDate = dto.FollowUpDate;
        entity.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.DeathInvestigations.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<DeathInvestigationDto>.SuccessResult(await MapToDto(entity, cancellationToken), "更新成功");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.DeathInvestigations.GetByIdAsync(id, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse.Failure("死亡调查不存在");
        }

        if (entity.Status == InvestigationStatus.Completed || entity.Status == InvestigationStatus.Closed)
        {
            return ApiResponse.Failure("已完成或已关闭的调查不能删除");
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var relatedDeathRecords = await _unitOfWork.DeathRecords.FindAsync(
                d => d.InvestigationId == id,
                cancellationToken);

            foreach (var deathRecord in relatedDeathRecords)
            {
                deathRecord.InvestigationId = null;
                deathRecord.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.DeathRecords.UpdateAsync(deathRecord, cancellationToken);
            }

            await _unitOfWork.DeathInvestigations.DeleteAsync(id, cancellationToken);
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

    private async Task<string> GenerateInvestigationNumberAsync(CancellationToken cancellationToken)
    {
        var dateStr = DateTime.Now.ToString("yyyyMMdd");
        var prefix = $"INV{dateStr}";

        var todayInvestigations = await _unitOfWork.DeathInvestigations.FindAsync(
            i => i.InvestigationNumber.StartsWith(prefix),
            cancellationToken);

        var maxSeq = 0;
        foreach (var i in todayInvestigations)
        {
            var seqStr = i.InvestigationNumber.Substring(prefix.Length);
            if (int.TryParse(seqStr, out var seq) && seq > maxSeq)
            {
                maxSeq = seq;
            }
        }

        return $"{prefix}{(maxSeq + 1).ToString("D4")}";
    }

    private async Task<DeathInvestigationDto> MapToDto(DeathInvestigation entity, CancellationToken cancellationToken)
    {
        var relatedDeathRecords = new List<DeathRecordBriefDto>();

        ICollection<DeathRecord>? deathRecords = null;
        if (entity.DeathRecords != null && entity.DeathRecords.Any())
        {
            deathRecords = entity.DeathRecords;
        }
        else
        {
            var records = await _unitOfWork.DeathRecords.FindAsync(
                d => d.InvestigationId == entity.Id && !d.IsDeleted,
                cancellationToken);
            deathRecords = records.ToList();
        }

        foreach (var deathRecord in deathRecords)
        {
            string? batchNumber = null;
            if (deathRecord.AnimalBatch != null)
            {
                batchNumber = deathRecord.AnimalBatch.BatchNumber;
            }
            else
            {
                var batch = await _unitOfWork.AnimalBatches.GetByIdAsync(deathRecord.AnimalBatchId, cancellationToken);
                if (batch != null && !batch.IsDeleted)
                {
                    batchNumber = batch.BatchNumber;
                }
            }

            relatedDeathRecords.Add(new DeathRecordBriefDto
            {
                Id = deathRecord.Id,
                RecordNumber = deathRecord.RecordNumber,
                DeathDate = deathRecord.DeathDate,
                DeathCount = deathRecord.DeathCount,
                BatchNumber = batchNumber
            });
        }

        return new DeathInvestigationDto
        {
            Id = entity.Id,
            InvestigationNumber = entity.InvestigationNumber,
            Status = entity.Status,
            StartDate = entity.StartDate,
            CompletedDate = entity.CompletedDate,
            InvestigatorId = entity.InvestigatorId,
            InvestigatorName = entity.InvestigatorName,
            TeamMembers = entity.TeamMembers,
            Background = entity.Background,
            InvestigationMethod = entity.InvestigationMethod,
            Findings = entity.Findings,
            RootCause = entity.RootCause,
            CorrectiveActions = entity.CorrectiveActions,
            PreventiveMeasures = entity.PreventiveMeasures,
            Conclusion = entity.Conclusion,
            Remarks = entity.Remarks,
            FollowUpDate = entity.FollowUpDate,
            RelatedDeathRecords = relatedDeathRecords
        };
    }
}
