using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;

namespace LabAnimalManagement.Application.Services.Interfaces;

public interface IAnimalOrderService
{
    Task<ApiResponse<PagedResult<AnimalOrderDto>>> GetPagedAsync(PagedQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalOrderDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalOrderDto>> CreateAsync(CreateAnimalOrderDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalOrderDto>> UpdateAsync(Guid id, UpdateAnimalOrderDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalOrderDto>> SubmitAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalOrderDto>> ApproveAsync(Guid id, ApproveOrderDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalOrderDto>> RejectAsync(Guid id, RejectOrderDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnimalOrderDto>> MarkInTransitAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<Guid>> ReceiveAsync(Guid id, ReceiveOrderDto dto, CancellationToken cancellationToken = default);
}
