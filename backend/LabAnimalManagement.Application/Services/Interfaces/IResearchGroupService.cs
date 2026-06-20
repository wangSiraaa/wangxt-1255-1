using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;

namespace LabAnimalManagement.Application.Services.Interfaces;

public interface IResearchGroupService
{
    Task<ApiResponse<PagedResult<ResearchGroupDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<ResearchGroupDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<ResearchGroupDto>> CreateAsync(CreateResearchGroupDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ResearchGroupDto>> UpdateAsync(Guid id, UpdateResearchGroupDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
