using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LabAnimalManagement.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CageAllocationsController : ControllerBase
{
    private readonly ICageAllocationService _service;

    public CageAllocationsController(ICageAllocationService service)
    {
        _service = service;
    }

    [HttpGet("batch/{batchId}")]
    public async Task<ActionResult<ApiResponse<List<CageAllocationDto>>>> GetByBatch(
        Guid batchId,
        CancellationToken cancellationToken)
    {
        var result = await _service.GetByBatchIdAsync(batchId, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("cage/{cageId}")]
    public async Task<ActionResult<ApiResponse<List<CageAllocationDto>>>> GetByCage(
        Guid cageId,
        CancellationToken cancellationToken)
    {
        var result = await _service.GetByCageIdAsync(cageId, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("allocate")]
    public async Task<ActionResult<ApiResponse<CageAllocationDto>>> Allocate(
        [FromBody] CreateCageAllocationDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.CreateAllocationAsync(dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{allocationId}/release")]
    public async Task<ActionResult<ApiResponse>> Release(
        Guid allocationId,
        [FromBody] ReleaseCageAllocationDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.ReleaseAllocationAsync(allocationId, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
