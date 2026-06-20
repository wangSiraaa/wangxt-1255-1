using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LabAnimalManagement.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EthicsApprovalsController : ControllerBase
{
    private readonly IEthicsApprovalService _service;

    public EthicsApprovalsController(IEthicsApprovalService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<EthicsApprovalDto>>>> GetPaged(
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
    public async Task<ActionResult<ApiResponse<EthicsApprovalDto>>> GetById(
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
    public async Task<ActionResult<ApiResponse<IEnumerable<EthicsApprovalDto>>>> GetByResearchGroup(
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

    [HttpGet("{id}/check-validity")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckValidity(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _service.CheckValidityAsync(id, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("{id}/used-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUsedCount(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _service.GetUsedAnimalCountAsync(id, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<EthicsApprovalDto>>> Create(
        [FromBody] CreateEthicsApprovalDto dto,
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
    public async Task<ActionResult<ApiResponse<EthicsApprovalDto>>> Update(
        Guid id,
        [FromBody] UpdateEthicsApprovalDto dto,
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
}
