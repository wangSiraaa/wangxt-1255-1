using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;

namespace LabAnimalManagement.Application.Services.Interfaces;

public interface ICageLocationService
{
    Task<ApiResponse<PagedResult<CageLocationDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<CageLocationDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<CageLocationDto>> CreateAsync(CreateCageLocationDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<CageLocationDto>> UpdateAsync(Guid id, UpdateCageLocationDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<CageLocationDto>>> GetAvailableCagesAsync(int requiredCapacity = 1, CancellationToken cancellationToken = default);
}
