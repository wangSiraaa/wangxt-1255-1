using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using LabAnimalManagement.Domain.Interfaces;

namespace LabAnimalManagement.Application.Services;

public class CageLocationService : ICageLocationService
{
    private readonly IUnitOfWork _unitOfWork;

    public CageLocationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<PagedResult<CageLocationDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _unitOfWork.CageLocations.GetAllAsync(cancellationToken);
            var query = all.Where(x => !x.IsDeleted).AsQueryable();

            if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
            {
                query = query.Where(x =>
                    x.LocationCode.Contains(queryParams.SearchTerm) ||
                    x.Building.Contains(queryParams.SearchTerm) ||
                    x.Floor.Contains(queryParams.SearchTerm) ||
                    x.Room.Contains(queryParams.SearchTerm) ||
                    (x.Rack != null && x.Rack.Contains(queryParams.SearchTerm)) ||
                    (x.Position != null && x.Position.Contains(queryParams.SearchTerm)));
            }

            var totalCount = query.Count();

            if (!string.IsNullOrWhiteSpace(queryParams.SortBy))
            {
                var sortOrder = queryParams.SortOrder?.ToLower() == "desc";
                query = queryParams.SortBy.ToLower() switch
                {
                    "locationcode" => sortOrder ? query.OrderByDescending(x => x.LocationCode) : query.OrderBy(x => x.LocationCode),
                    "building" => sortOrder ? query.OrderByDescending(x => x.Building) : query.OrderBy(x => x.Building),
                    "floor" => sortOrder ? query.OrderByDescending(x => x.Floor) : query.OrderBy(x => x.Floor),
                    "room" => sortOrder ? query.OrderByDescending(x => x.Room) : query.OrderBy(x => x.Room),
                    "maxcapacity" => sortOrder ? query.OrderByDescending(x => x.MaxCapacity) : query.OrderBy(x => x.MaxCapacity),
                    "currentoccupancy" => sortOrder ? query.OrderByDescending(x => x.CurrentOccupancy) : query.OrderBy(x => x.CurrentOccupancy),
                    "status" => sortOrder ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
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
                .Select(MapToDto)
                .ToList();

            var result = new PagedResult<CageLocationDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            return ApiResponse<PagedResult<CageLocationDto>>.SuccessResult(result);
        }
        catch (Exception ex)
        {
            return ApiResponse<PagedResult<CageLocationDto>>.FailureResult("获取笼位列表失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<CageLocationDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.CageLocations.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<CageLocationDto>.FailureResult("笼位不存在");
            }

            return ApiResponse<CageLocationDto>.SuccessResult(MapToDto(entity));
        }
        catch (Exception ex)
        {
            return ApiResponse<CageLocationDto>.FailureResult("获取笼位详情失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<CageLocationDto>> CreateAsync(CreateCageLocationDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var existingByCode = await _unitOfWork.CageLocations.FindAsync(
                x => x.LocationCode == dto.LocationCode && !x.IsDeleted, cancellationToken);
            if (existingByCode.Any())
            {
                return ApiResponse<CageLocationDto>.FailureResult("位置编码已存在");
            }

            if (dto.MaxCapacity <= 0)
            {
                return ApiResponse<CageLocationDto>.FailureResult("最大容量必须大于0");
            }

            var entity = new CageLocation
            {
                Id = Guid.NewGuid(),
                LocationCode = dto.LocationCode,
                Building = dto.Building,
                Floor = dto.Floor,
                Room = dto.Room,
                Rack = dto.Rack,
                Position = dto.Position,
                BarrierLevel = dto.BarrierLevel,
                MaxCapacity = dto.MaxCapacity,
                CurrentOccupancy = 0,
                Status = dto.Status,
                Remarks = dto.Remarks,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _unitOfWork.CageLocations.AddAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse<CageLocationDto>.SuccessResult(MapToDto(created), "创建成功");
        }
        catch (Exception ex)
        {
            return ApiResponse<CageLocationDto>.FailureResult("创建笼位失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<CageLocationDto>> UpdateAsync(Guid id, UpdateCageLocationDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.CageLocations.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<CageLocationDto>.FailureResult("笼位不存在");
            }

            var existingByCode = await _unitOfWork.CageLocations.FindAsync(
                x => x.LocationCode == dto.LocationCode && x.Id != id && !x.IsDeleted, cancellationToken);
            if (existingByCode.Any())
            {
                return ApiResponse<CageLocationDto>.FailureResult("位置编码已存在");
            }

            if (dto.MaxCapacity < entity.CurrentOccupancy)
            {
                return ApiResponse<CageLocationDto>.FailureResult("最大容量不能小于当前占用数");
            }

            entity.LocationCode = dto.LocationCode;
            entity.Building = dto.Building;
            entity.Floor = dto.Floor;
            entity.Room = dto.Room;
            entity.Rack = dto.Rack;
            entity.Position = dto.Position;
            entity.BarrierLevel = dto.BarrierLevel;
            entity.MaxCapacity = dto.MaxCapacity;
            entity.Status = dto.Status;
            entity.Remarks = dto.Remarks;
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CageLocations.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse<CageLocationDto>.SuccessResult(MapToDto(entity), "更新成功");
        }
        catch (Exception ex)
        {
            return ApiResponse<CageLocationDto>.FailureResult("更新笼位失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.CageLocations.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse.Failure("笼位不存在");
            }

            if (entity.CurrentOccupancy > 0)
            {
                return ApiResponse.Failure("笼位仍有动物占用，不能删除");
            }

            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CageLocations.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success("删除成功");
        }
        catch (Exception ex)
        {
            return ApiResponse.Failure("删除笼位失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<List<CageLocationDto>>> GetAvailableCagesAsync(int requiredCapacity = 1, CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _unitOfWork.CageLocations.GetAllAsync(cancellationToken);
            var available = all
                .Where(x => !x.IsDeleted
                    && x.Status == CageStatus.Available
                    && x.HasCapacity(requiredCapacity))
                .Select(MapToDto)
                .ToList();

            return ApiResponse<List<CageLocationDto>>.SuccessResult(available);
        }
        catch (Exception ex)
        {
            return ApiResponse<List<CageLocationDto>>.FailureResult("查询可用笼位失败", new List<string> { ex.Message });
        }
    }

    private static CageLocationDto MapToDto(CageLocation entity)
    {
        return new CageLocationDto
        {
            Id = entity.Id,
            LocationCode = entity.LocationCode,
            Building = entity.Building,
            Floor = entity.Floor,
            Room = entity.Room,
            Rack = entity.Rack,
            Position = entity.Position,
            BarrierLevel = entity.BarrierLevel,
            MaxCapacity = entity.MaxCapacity,
            CurrentOccupancy = entity.CurrentOccupancy,
            Status = entity.Status,
            Remarks = entity.Remarks
        };
    }
}
