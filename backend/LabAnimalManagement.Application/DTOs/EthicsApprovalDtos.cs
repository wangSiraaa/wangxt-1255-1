using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Application.DTOs;

public class EthicsApprovalDto
{
    public Guid Id { get; set; }
    public string ApprovalNumber { get; set; } = string.Empty;
    public Guid ResearchGroupId { get; set; }
    public string? ResearchGroupName { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ApprovalDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public EthicsApprovalStatus Status { get; set; }
    public string? ApprovedBy { get; set; }
    public int MaxAnimalCount { get; set; }
    public int UsedAnimalCount { get; set; }
    public string? SpeciesAllowed { get; set; }
    public string? Remarks { get; set; }
    public bool IsExpired { get; set; }
    public bool IsValid { get; set; }
    public int RemainingDays { get; set; }
}

public class CreateEthicsApprovalDto
{
    public string ApprovalNumber { get; set; } = string.Empty;
    public Guid ResearchGroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ApprovalDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public EthicsApprovalStatus Status { get; set; } = EthicsApprovalStatus.Pending;
    public string? ApprovedBy { get; set; }
    public int MaxAnimalCount { get; set; }
    public string? SpeciesAllowed { get; set; }
    public string? Remarks { get; set; }
    public string? ApprovalDocumentPath { get; set; }
}

public class UpdateEthicsApprovalDto
{
    public string ApprovalNumber { get; set; } = string.Empty;
    public Guid ResearchGroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ApprovalDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public EthicsApprovalStatus Status { get; set; }
    public string? ApprovedBy { get; set; }
    public int MaxAnimalCount { get; set; }
    public string? SpeciesAllowed { get; set; }
    public string? Remarks { get; set; }
    public string? ApprovalDocumentPath { get; set; }
}
