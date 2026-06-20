using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;

namespace LabAnimalManagement.Application.Services.Interfaces;

public interface IDeathInvestigationService
{
    Task<ApiResponse<DeathInvestigationDto>> CreateAsync(CreateDeathInvestigationDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<DeathInvestigationDto>> CompleteAsync(Guid investigationId, CompleteInvestigationDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<DeathInvestigationDto>> CloseAsync(Guid investigationId, CancellationToken cancellationToken = default);
    Task<ApiResponse<DeathInvestigationDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<PagedResult<DeathInvestigationDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<DeathInvestigationDto>>> GetByBatchIdAsync(Guid batchId, CancellationToken cancellationToken = default);
    Task<ApiResponse<DeathInvestigationDto>> UpdateAsync(Guid id, UpdateDeathInvestigationDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
