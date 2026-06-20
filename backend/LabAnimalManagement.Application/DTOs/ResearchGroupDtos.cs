namespace LabAnimalManagement.Application.DTOs;

public class ResearchGroupDto
{
    public Guid Id { get; set; }
    public string GroupCode { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public string? PrincipalInvestigator { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Department { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateResearchGroupDto
{
    public string GroupCode { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public string? PrincipalInvestigator { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Department { get; set; }
    public string? Description { get; set; }
}

public class UpdateResearchGroupDto
{
    public string GroupCode { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public string? PrincipalInvestigator { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Department { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
