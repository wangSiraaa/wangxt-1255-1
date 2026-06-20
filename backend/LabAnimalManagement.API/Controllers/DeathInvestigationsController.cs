using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LabAnimalManagement.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DeathInvestigationsController : ControllerBase
{
    private readonly IDeathInvestigationService _service;

    public DeathInvestigationsController(IDeathInvestigationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<DeathInvestigationDto>>>> GetPaged(
        [FromQuery] PagedQueryParams queryParams,
        CancellationToken cancellationToken)
    {
        var result = await _service.GetPagedAsync(queryParams, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<DeathInvestigationDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _service.GetByIdAsync(id, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("batch/{batchId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<DeathInvestigationDto>>>> GetByBatch(
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

    [HttpPost]
    public async Task<ActionResult<ApiResponse<DeathInvestigationDto>>> Create(
        [FromBody] CreateDeathInvestigationDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.CreateAsync(dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<DeathInvestigationDto>>> Update(
        Guid id,
        [FromBody] UpdateDeathInvestigationDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.UpdateAsync(id, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<ApiResponse<DeathInvestigationDto>>> Complete(
        Guid id,
        [FromBody] CompleteInvestigationDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.CompleteAsync(id, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id}/close")]
    public async Task<ActionResult<ApiResponse<DeathInvestigationDto>>> Close(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _service.CloseAsync(id, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _service.DeleteAsync(id, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
