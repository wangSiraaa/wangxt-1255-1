using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;

namespace LabAnimalManagement.Application.Services.Interfaces;

public interface IAnimalBatchService
{
    Task<ApiResponse<PagedResult<AnimalBatchDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalBatchDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalBatchDto>> CreateAsync(CreateAnimalBatchDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalBatchDto>> UpdateAsync(Guid id, UpdateAnimalBatchDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse> CloseBatchAsync(Guid batchId, CloseBatchDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<AnimalBatchDto>>> GetByResearchGroupIdAsync(Guid researchGroupId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<AnimalBatchDto>>> GetActiveBatchesAsync(CancellationToken cancellationToken = default);
}
