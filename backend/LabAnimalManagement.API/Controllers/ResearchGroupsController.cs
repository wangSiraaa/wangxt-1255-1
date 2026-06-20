using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Application.DTOs.Common;
using LabAnimalManagement.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LabAnimalManagement.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ResearchGroupsController : ControllerBase
{
    private readonly IResearchGroupService _service;

    public ResearchGroupsController(IResearchGroupService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ResearchGroupDto>>>> GetPaged(
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
    public async Task<ActionResult<ApiResponse<ResearchGroupDto>>> GetById(
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
    public async Task<ActionResult<ApiResponse<ResearchGroupDto>>> Create(
        [FromBody] CreateResearchGroupDto dto,
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
    public async Task<ActionResult<ApiResponse<ResearchGroupDto>>> Update(
        Guid id,
        [FromBody] UpdateResearchGroupDto dto,
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
