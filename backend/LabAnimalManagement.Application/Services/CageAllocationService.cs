using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using LabAnimalManagement.Domain.Interfaces;

namespace LabAnimalManagement.Application.Services;

public class CageAllocationService : ICageAllocationService
{
    private readonly IUnitOfWork _unitOfWork;

    public CageAllocationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<CageAllocationDto>> CreateAllocationAsync(CreateCageAllocationDto dto, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            if (dto.AnimalCount <= 0)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse<CageAllocationDto>.FailureResult("分配动物数量必须大于0");
            }

            var cage = await _unitOfWork.CageLocations.GetByIdAsync(dto.CageLocationId, cancellationToken);
            if (cage == null || cage.IsDeleted)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse<CageAllocationDto>.FailureResult("笼位不存在");
            }

            if (cage.Status != CageStatus.Available && cage.Status != CageStatus.Occupied)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse<CageAllocationDto>.FailureResult("笼位当前状态不可用");
            }

            if (!cage.HasCapacity(dto.AnimalCount))
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse<CageAllocationDto>.FailureResult("笼位容量不足，无法分配");
            }

            var batch = await _unitOfWork.AnimalBatches.GetByIdAsync(dto.AnimalBatchId, cancellationToken);
            if (batch == null || batch.IsDeleted)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse<CageAllocationDto>.FailureResult("动物批次不存在");
            }

            if (batch.CurrentCount < dto.AnimalCount)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse<CageAllocationDto>.FailureResult("批次剩余动物数量不足");
            }

            var allocation = new CageAllocation
            {
                Id = Guid.NewGuid(),
                AnimalBatchId = dto.AnimalBatchId,
                CageLocationId = dto.CageLocationId,
                AnimalCount = dto.AnimalCount,
                AllocationDate = DateTime.UtcNow,
                ReleaseDate = null,
                AllocatedBy = dto.AllocatedBy,
                Remarks = dto.Remarks,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            cage.CurrentOccupancy += dto.AnimalCount;
            if (cage.CurrentOccupancy >= cage.MaxCapacity)
            {
                cage.Status = CageStatus.Occupied;
            }
            else if (cage.CurrentOccupancy > 0 && cage.Status == CageStatus.Available)
            {
                cage.Status = CageStatus.Occupied;
            }
            cage.UpdatedAt = DateTime.UtcNow;

            var created = await _unitOfWork.CageAllocations.AddAsync(allocation, cancellationToken);
            await _unitOfWork.CageLocations.UpdateAsync(cage, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return ApiResponse<CageAllocationDto>.SuccessResult(await MapToDto(created, cancellationToken), "分配成功");
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            return ApiResponse<CageAllocationDto>.FailureResult("分配笼位失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse> ReleaseAllocationAsync(Guid allocationId, ReleaseCageAllocationDto dto, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var allocation = await _unitOfWork.CageAllocations.GetByIdAsync(allocationId, cancellationToken);
            if (allocation == null || allocation.IsDeleted)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse.Failure("分配记录不存在");
            }

            if (!allocation.IsActive)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse.Failure("该分配记录已释放");
            }

            var cage = await _unitOfWork.CageLocations.GetByIdAsync(allocation.CageLocationId, cancellationToken);
            if (cage == null || cage.IsDeleted)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return ApiResponse.Failure("关联笼位不存在");
            }

            allocation.IsActive = false;
            allocation.ReleaseDate = dto.ReleaseDate;
            allocation.Remarks = dto.Remarks;
            allocation.UpdatedAt = DateTime.UtcNow;

            cage.CurrentOccupancy = Math.Max(0, cage.CurrentOccupancy - allocation.AnimalCount);
            if (cage.CurrentOccupancy == 0)
            {
                cage.Status = CageStatus.Available;
            }
            cage.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CageAllocations.UpdateAsync(allocation, cancellationToken);
            await _unitOfWork.CageLocations.UpdateAsync(cage, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return ApiResponse.Success("释放成功");
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            return ApiResponse.Failure("释放笼位失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<List<CageAllocationDto>>> GetByBatchIdAsync(Guid batchId, CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _unitOfWork.CageAllocations.GetAllAsync(cancellationToken);
            var allocations = all
                .Where(x => !x.IsDeleted && x.AnimalBatchId == batchId)
                .OrderByDescending(x => x.CreatedAt)
                .ToList();

            var dtos = new List<CageAllocationDto>();
            foreach (var a in allocations)
            {
                dtos.Add(await MapToDto(a, cancellationToken));
            }

            return ApiResponse<List<CageAllocationDto>>.SuccessResult(dtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<List<CageAllocationDto>>.FailureResult("查询批次分配记录失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<List<CageAllocationDto>>> GetByCageIdAsync(Guid cageId, CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _unitOfWork.CageAllocations.GetAllAsync(cancellationToken);
            var allocations = all
                .Where(x => !x.IsDeleted && x.CageLocationId == cageId)
                .OrderByDescending(x => x.CreatedAt)
                .ToList();

            var dtos = new List<CageAllocationDto>();
            foreach (var a in allocations)
            {
                dtos.Add(await MapToDto(a, cancellationToken));
            }

            return ApiResponse<List<CageAllocationDto>>.SuccessResult(dtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<List<CageAllocationDto>>.FailureResult("查询笼位分配记录失败", new List<string> { ex.Message });
        }
    }

    private async Task<CageAllocationDto> MapToDto(CageAllocation entity, CancellationToken cancellationToken = default)
    {
        var batch = await _unitOfWork.AnimalBatches.GetByIdAsync(entity.AnimalBatchId, cancellationToken);
        var cage = await _unitOfWork.CageLocations.GetByIdAsync(entity.CageLocationId, cancellationToken);

        return new CageAllocationDto
        {
            Id = entity.Id,
            AnimalBatchId = entity.AnimalBatchId,
            BatchNumber = batch?.BatchNumber,
            CageLocationId = entity.CageLocationId,
            LocationCode = cage?.LocationCode,
            LocationDisplay = cage != null ? $"{cage.Building}-{cage.Floor}-{cage.Room}{(cage.Rack != null ? $"-{cage.Rack}" : "")}{(cage.Position != null ? $"-{cage.Position}" : "")}" : null,
            AnimalCount = entity.AnimalCount,
            AllocationDate = entity.AllocationDate,
            ReleaseDate = entity.ReleaseDate,
            AllocatedBy = entity.AllocatedBy,
            Remarks = entity.Remarks,
            IsActive = entity.IsActive
        };
    }
}
