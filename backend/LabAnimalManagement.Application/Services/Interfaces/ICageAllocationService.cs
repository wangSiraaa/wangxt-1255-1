using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;

namespace LabAnimalManagement.Application.Services.Interfaces;

public interface ICageAllocationService
{
    Task<ApiResponse<CageAllocationDto>> CreateAllocationAsync(CreateCageAllocationDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> ReleaseAllocationAsync(Guid allocationId, ReleaseCageAllocationDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<CageAllocationDto>>> GetByBatchIdAsync(Guid batchId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<CageAllocationDto>>> GetByCageIdAsync(Guid cageId, CancellationToken cancellationToken = default);
}
