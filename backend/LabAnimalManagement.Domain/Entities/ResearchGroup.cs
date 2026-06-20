using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Domain.Entities;

public class ResearchGroup : BaseEntity
{
    public string GroupCode { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public string? PrincipalInvestigator { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Department { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<EthicsApproval> EthicsApprovals { get; set; } = new List<EthicsApproval>();
    public ICollection<AnimalOrder> AnimalOrders { get; set; } = new List<AnimalOrder>();
    public ICollection<AnimalBatch> AnimalBatches { get; set; } = new List<AnimalBatch>();
}
