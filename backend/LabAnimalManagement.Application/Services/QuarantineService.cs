using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using LabAnimalManagement.Domain.Interfaces;

namespace LabAnimalManagement.Application.Services;

public class QuarantineService : IQuarantineService
{
    private readonly IUnitOfWork _unitOfWork;

    public QuarantineService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<QuarantineRecordDto>> StartQuarantineAsync(CreateQuarantineRecordDto dto, CancellationToken cancellationToken = default)
    {
        var batch = await _unitOfWork.AnimalBatches.GetByIdAsync(dto.AnimalBatchId, cancellationToken);
        if (batch == null || batch.IsDeleted)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("动物批次不存在");
        }

        if (batch.Status != BatchStatus.PendingQuarantine && batch.Status != BatchStatus.QuarantinePassed)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("当前批次状态不允许开始检疫");
        }

        if (dto.DurationDays <= 0)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("检疫持续天数必须大于0");
        }

        var cageLocation = await _unitOfWork.CageLocations.GetByIdAsync(dto.CageLocationId, cancellationToken);
        if (cageLocation == null || cageLocation.IsDeleted)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("笼位位置不存在");
        }

        var recordNumber = await GenerateRecordNumberAsync(cancellationToken);

        var entity = new QuarantineRecord
        {
            Id = Guid.NewGuid(),
            RecordNumber = recordNumber,
            AnimalBatchId = dto.AnimalBatchId,
            CageLocationId = dto.CageLocationId,
            VeterinarianId = dto.VeterinarianId,
            VeterinarianName = dto.VeterinarianName,
            StartDate = dto.StartDate,
            DurationDays = dto.DurationDays,
            Passed = false,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow
        };

        batch.Status = BatchStatus.InQuarantine;
        batch.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.QuarantineRecords.AddAsync(entity, cancellationToken);
        await _unitOfWork.AnimalBatches.UpdateAsync(batch, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<QuarantineRecordDto>.SuccessResult(await MapToDto(entity, cancellationToken), "检疫开始成功");
    }

    public async Task<ApiResponse<QuarantineRecordDto>> CompleteQuarantineAsync(Guid recordId, CompleteQuarantineDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.QuarantineRecords.GetByIdAsync(recordId, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("检疫记录不存在");
        }

        if (entity.EndDate.HasValue)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("该检疫已完成，不可重复操作");
        }

        if (dto.EndDate < entity.StartDate)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("结束日期不能早于开始日期");
        }

        if (string.IsNullOrWhiteSpace(dto.Conclusion))
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("检疫结论不能为空");
        }

        entity.EndDate = dto.EndDate;
        entity.Passed = dto.Passed;
        entity.Observations = dto.Observations;
        entity.ClinicalSigns = dto.ClinicalSigns;
        entity.LabResults = dto.LabResults;
        entity.TreatmentGiven = dto.TreatmentGiven;
        entity.Conclusion = dto.Conclusion;
        entity.UpdatedAt = DateTime.UtcNow;

        var batch = await _unitOfWork.AnimalBatches.GetByIdAsync(entity.AnimalBatchId, cancellationToken);
        if (batch != null && !batch.IsDeleted)
        {
            if (dto.Passed)
            {
                batch.Status = BatchStatus.QuarantinePassed;
            }
            batch.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.AnimalBatches.UpdateAsync(batch, cancellationToken);
        }

        await _unitOfWork.QuarantineRecords.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<QuarantineRecordDto>.SuccessResult(await MapToDto(entity, cancellationToken), "检疫完成");
    }

    public async Task<ApiResponse<PagedResult<QuarantineRecordDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var allEntities = await _unitOfWork.QuarantineRecords.GetAllAsync(cancellationToken);
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
                "startdate" => descending ? query.OrderByDescending(e => e.StartDate) : query.OrderBy(e => e.StartDate),
                "enddate" => descending ? query.OrderByDescending(e => e.EndDate) : query.OrderBy(e => e.EndDate),
                "passed" => descending ? query.OrderByDescending(e => e.Passed) : query.OrderBy(e => e.Passed),
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

        var dtos = new List<QuarantineRecordDto>();
        foreach (var entity in pagedEntities)
        {
            dtos.Add(await MapToDto(entity, cancellationToken));
        }

        var result = new PagedResult<QuarantineRecordDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize
        };

        return ApiResponse<PagedResult<QuarantineRecordDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<QuarantineRecordDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.QuarantineRecords.GetByIdAsync(id, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("检疫记录不存在");
        }

        return ApiResponse<QuarantineRecordDto>.SuccessResult(await MapToDto(entity, cancellationToken));
    }

    public async Task<ApiResponse<IEnumerable<QuarantineRecordDto>>> GetByBatchIdAsync(Guid batchId, CancellationToken cancellationToken = default)
    {
        var entities = await _unitOfWork.QuarantineRecords.FindAsync(
            e => e.AnimalBatchId == batchId && !e.IsDeleted,
            cancellationToken);

        var dtos = new List<QuarantineRecordDto>();
        foreach (var entity in entities.OrderByDescending(e => e.CreatedAt))
        {
            dtos.Add(await MapToDto(entity, cancellationToken));
        }

        return ApiResponse<IEnumerable<QuarantineRecordDto>>.SuccessResult(dtos);
    }

    public async Task<ApiResponse<QuarantineRecordDto>> UpdateAsync(Guid id, UpdateQuarantineRecordDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.QuarantineRecords.GetByIdAsync(id, cancellationToken);
        if (entity == null || entity.IsDeleted)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("检疫记录不存在");
        }

        if (dto.EndDate.HasValue && dto.EndDate < entity.StartDate)
        {
            return ApiResponse<QuarantineRecordDto>.FailureResult("结束日期不能早于开始日期");
        }

        entity.EndDate = dto.EndDate;
        entity.Passed = dto.Passed;
        entity.Observations = dto.Observations;
        entity.ClinicalSigns = dto.ClinicalSigns;
        entity.LabResults = dto.LabResults;
        entity.TreatmentGiven = dto.TreatmentGiven;
        entity.Conclusion = dto.Conclusion;
        entity.Remarks = dto.Remarks;
        entity.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.QuarantineRecords.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<QuarantineRecordDto>.SuccessResult(await MapToDto(entity, cancellationToken), "更新成功");
    }

    private async Task<string> GenerateRecordNumberAsync(CancellationToken cancellationToken)
    {
        var dateStr = DateTime.Now.ToString("yyyyMMdd");
        var prefix = $"QR{dateStr}";

        var todayRecords = await _unitOfWork.QuarantineRecords.FindAsync(
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

    private async Task<QuarantineRecordDto> MapToDto(QuarantineRecord entity, CancellationToken cancellationToken)
    {
        var batchNumber = string.Empty;
        var locationCode = string.Empty;

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

        if (entity.CageLocation != null)
        {
            locationCode = entity.CageLocation.LocationCode;
        }
        else
        {
            var cageLocation = await _unitOfWork.CageLocations.GetByIdAsync(entity.CageLocationId, cancellationToken);
            if (cageLocation != null && !cageLocation.IsDeleted)
            {
                locationCode = cageLocation.LocationCode;
            }
        }

        return new QuarantineRecordDto
        {
            Id = entity.Id,
            RecordNumber = entity.RecordNumber,
            AnimalBatchId = entity.AnimalBatchId,
            BatchNumber = batchNumber,
            CageLocationId = entity.CageLocationId,
            LocationCode = locationCode,
            VeterinarianId = entity.VeterinarianId,
            VeterinarianName = entity.VeterinarianName,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            DurationDays = entity.DurationDays,
            Passed = entity.Passed,
            Observations = entity.Observations,
            ClinicalSigns = entity.ClinicalSigns,
            LabResults = entity.LabResults,
            TreatmentGiven = entity.TreatmentGiven,
            Conclusion = entity.Conclusion,
            Remarks = entity.Remarks
        };
    }
}
