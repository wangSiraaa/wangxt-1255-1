using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Domain.Entities;

public class EthicsApproval : BaseEntity
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

    public ResearchGroup? ResearchGroup { get; set; }
    public ICollection<AnimalOrder> AnimalOrders { get; set; } = new List<AnimalOrder>();

    public bool IsValid()
    {
        return Status == EthicsApprovalStatus.Approved 
               && DateTime.Now >= ApprovalDate 
               && DateTime.Now <= ExpiryDate;
    }

    public bool IsExpired()
    {
        return DateTime.Now > ExpiryDate;
    }
}
