using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;

namespace LabAnimalManagement.Application.Services.Interfaces;

public interface IQuarantineService
{
    Task<ApiResponse<QuarantineRecordDto>> StartQuarantineAsync(CreateQuarantineRecordDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<QuarantineRecordDto>> CompleteQuarantineAsync(Guid recordId, CompleteQuarantineDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<PagedResult<QuarantineRecordDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<QuarantineRecordDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<QuarantineRecordDto>>> GetByBatchIdAsync(Guid batchId, CancellationToken cancellationToken = default);
    Task<ApiResponse<QuarantineRecordDto>> UpdateAsync(Guid id, UpdateQuarantineRecordDto dto, CancellationToken cancellationToken = default);
}
