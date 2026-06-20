using AutoMapper;
using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Interfaces;

namespace LabAnimalManagement.Application.Services;

public class ResearchGroupService : IResearchGroupService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ResearchGroupService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<ResearchGroupDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _unitOfWork.ResearchGroups.GetAllAsync(cancellationToken);
            var query = all.Where(x => !x.IsDeleted).AsQueryable();

            if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
            {
                query = query.Where(x =>
                    x.GroupCode.Contains(queryParams.SearchTerm) ||
                    x.GroupName.Contains(queryParams.SearchTerm) ||
                    (x.PrincipalInvestigator != null && x.PrincipalInvestigator.Contains(queryParams.SearchTerm)) ||
                    (x.Department != null && x.Department.Contains(queryParams.SearchTerm)));
            }

            var totalCount = query.Count();

            if (!string.IsNullOrWhiteSpace(queryParams.SortBy))
            {
                var sortOrder = queryParams.SortOrder?.ToLower() == "desc";
                query = queryParams.SortBy.ToLower() switch
                {
                    "groupcode" => sortOrder ? query.OrderByDescending(x => x.GroupCode) : query.OrderBy(x => x.GroupCode),
                    "groupname" => sortOrder ? query.OrderByDescending(x => x.GroupName) : query.OrderBy(x => x.GroupName),
                    "department" => sortOrder ? query.OrderByDescending(x => x.Department) : query.OrderBy(x => x.Department),
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

            var dtos = _mapper.Map<List<ResearchGroupDto>>(items);

            var result = new PagedResult<ResearchGroupDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            return ApiResponse<PagedResult<ResearchGroupDto>>.SuccessResult(result);
        }
        catch (Exception ex)
        {
            return ApiResponse<PagedResult<ResearchGroupDto>>.FailureResult("获取课题组列表失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<ResearchGroupDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.ResearchGroups.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<ResearchGroupDto>.FailureResult("课题组不存在");
            }

            var dto = _mapper.Map<ResearchGroupDto>(entity);
            return ApiResponse<ResearchGroupDto>.SuccessResult(dto);
        }
        catch (Exception ex)
        {
            return ApiResponse<ResearchGroupDto>.FailureResult("获取课题组详情失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<ResearchGroupDto>> CreateAsync(CreateResearchGroupDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var existingByCode = await _unitOfWork.ResearchGroups.FindAsync(
                x => x.GroupCode == dto.GroupCode && !x.IsDeleted, cancellationToken);
            if (existingByCode.Any())
            {
                return ApiResponse<ResearchGroupDto>.FailureResult("课题组编码已存在");
            }

            var existingByName = await _unitOfWork.ResearchGroups.FindAsync(
                x => x.GroupName == dto.GroupName && !x.IsDeleted, cancellationToken);
            if (existingByName.Any())
            {
                return ApiResponse<ResearchGroupDto>.FailureResult("课题组名称已存在");
            }

            var entity = _mapper.Map<ResearchGroup>(dto);
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = DateTime.UtcNow;
            entity.IsActive = true;

            var created = await _unitOfWork.ResearchGroups.AddAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var resultDto = _mapper.Map<ResearchGroupDto>(created);
            return ApiResponse<ResearchGroupDto>.SuccessResult(resultDto, "创建成功");
        }
        catch (Exception ex)
        {
            return ApiResponse<ResearchGroupDto>.FailureResult("创建课题组失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<ResearchGroupDto>> UpdateAsync(Guid id, UpdateResearchGroupDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.ResearchGroups.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse<ResearchGroupDto>.FailureResult("课题组不存在");
            }

            var existingByCode = await _unitOfWork.ResearchGroups.FindAsync(
                x => x.GroupCode == dto.GroupCode && x.Id != id && !x.IsDeleted, cancellationToken);
            if (existingByCode.Any())
            {
                return ApiResponse<ResearchGroupDto>.FailureResult("课题组编码已存在");
            }

            var existingByName = await _unitOfWork.ResearchGroups.FindAsync(
                x => x.GroupName == dto.GroupName && x.Id != id && !x.IsDeleted, cancellationToken);
            if (existingByName.Any())
            {
                return ApiResponse<ResearchGroupDto>.FailureResult("课题组名称已存在");
            }

            _mapper.Map(dto, entity);
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.ResearchGroups.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var resultDto = _mapper.Map<ResearchGroupDto>(entity);
            return ApiResponse<ResearchGroupDto>.SuccessResult(resultDto, "更新成功");
        }
        catch (Exception ex)
        {
            return ApiResponse<ResearchGroupDto>.FailureResult("更新课题组失败", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.ResearchGroups.GetByIdAsync(id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                return ApiResponse.Failure("课题组不存在");
            }

            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.ResearchGroups.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success("删除成功");
        }
        catch (Exception ex)
        {
            return ApiResponse.Failure("删除课题组失败", new List<string> { ex.Message });
        }
    }
}
