using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LabAnimalManagement.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class QuarantineController : ControllerBase
{
    private readonly IQuarantineService _service;

    public QuarantineController(IQuarantineService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<QuarantineRecordDto>>>> GetPaged(
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
    public async Task<ActionResult<ApiResponse<QuarantineRecordDto>>> GetById(
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
    public async Task<ActionResult<ApiResponse<IEnumerable<QuarantineRecordDto>>>> GetByBatch(
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

    [HttpPost("start")]
    public async Task<ActionResult<ApiResponse<QuarantineRecordDto>>> Start(
        [FromBody] CreateQuarantineRecordDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.StartQuarantineAsync(dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<QuarantineRecordDto>>> Update(
        Guid id,
        [FromBody] UpdateQuarantineRecordDto dto,
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
    public async Task<ActionResult<ApiResponse<QuarantineRecordDto>>> Complete(
        Guid id,
        [FromBody] CompleteQuarantineDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.CompleteQuarantineAsync(id, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
