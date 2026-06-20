using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LabAnimalManagement.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AnimalOrdersController : ControllerBase
{
    private readonly IAnimalOrderService _service;

    public AnimalOrdersController(IAnimalOrderService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AnimalOrderDto>>>> GetPaged(
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
    public async Task<ActionResult<ApiResponse<AnimalOrderDto>>> GetById(
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

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AnimalOrderDto>>> Create(
        [FromBody] CreateAnimalOrderDto dto,
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
    public async Task<ActionResult<ApiResponse<AnimalOrderDto>>> Update(
        Guid id,
        [FromBody] UpdateAnimalOrderDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.UpdateAsync(id, dto, cancellationToken);
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

    [HttpPost("{id}/submit")]
    public async Task<ActionResult<ApiResponse<AnimalOrderDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _service.SubmitAsync(id, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApiResponse<AnimalOrderDto>>> Approve(
        Guid id,
        [FromBody] ApproveOrderDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.ApproveAsync(id, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id}/reject")]
    public async Task<ActionResult<ApiResponse<AnimalOrderDto>>> Reject(
        Guid id,
        [FromBody] RejectOrderDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.RejectAsync(id, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id}/in-transit")]
    public async Task<ActionResult<ApiResponse<AnimalOrderDto>>> MarkInTransit(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _service.MarkInTransitAsync(id, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id}/receive")]
    public async Task<ActionResult<ApiResponse<Guid>>> Receive(
        Guid id,
        [FromBody] ReceiveOrderDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _service.ReceiveAsync(id, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
