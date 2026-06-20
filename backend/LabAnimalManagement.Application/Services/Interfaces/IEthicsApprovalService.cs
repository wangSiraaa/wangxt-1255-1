using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;

namespace LabAnimalManagement.Application.Services.Interfaces;

public interface IEthicsApprovalService
{
    Task<ApiResponse<EthicsApprovalDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<PagedResult<EthicsApprovalDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<EthicsApprovalDto>>> GetByResearchGroupIdAsync(Guid researchGroupId, CancellationToken cancellationToken = default);
    Task<ApiResponse<EthicsApprovalDto>> CreateAsync(CreateEthicsApprovalDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<EthicsApprovalDto>> UpdateAsync(Guid id, UpdateEthicsApprovalDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> CheckValidityAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> GetUsedAnimalCountAsync(Guid id, CancellationToken cancellationToken = default);
}
