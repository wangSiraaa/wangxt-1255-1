using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;

namespace LabAnimalManagement.Application.Services.Interfaces;

public interface IDeathRecordService
{
    Task<ApiResponse<DeathRecordDto>> CreateAsync(CreateDeathRecordDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<DeathRecordDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<PagedResult<DeathRecordDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<DeathRecordDto>>> GetByBatchIdAsync(Guid batchId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<DeathRecordDto>>> GetAbnormalDeathsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<DeathRecordDto>> UpdateAsync(Guid id, UpdateDeathRecordDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
