using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LabAnimalManagement.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AnimalBatchesController : ControllerBase
{
    private readonly IAnimalBatchService _service;

    public AnimalBatchesController(IAnimalBatchService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AnimalBatchDto>>>> GetPaged(
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
    public async Task<ActionResult<ApiResponse<AnimalBatchDto>>> GetById(
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

    [HttpGet("researchgroup/{researchGroupId}")]
    public async Task<ActionResult<ApiResponse<List<AnimalBatchDto>>>> GetByResearchGroup(
        Guid researchGroupId,
        CancellationToken cancellationToken)
    {
        var result = await _service.GetByResearchGroupIdAsync(researchGroupId, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<List<AnimalBatchDto>>>> GetActive(
        CancellationToken cancellationToken)
    {
        var result = await _service.GetActiveBatchesAsync(cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AnimalBatchDto>>> Create(
        [FromBody] CreateAnimalBatchDto dto,
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
    public async Task<ActionResult<ApiResponse<AnimalBatchDto>>> Update(
        Guid id,
        [FromBody] UpdateAnimalBatchDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.UpdateAsync(id, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id}/close")]
    public async Task<ActionResult<ApiResponse>> Close(
        Guid id,
        [FromBody] CloseBatchDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.CloseBatchAsync(id, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
