using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Domain.Entities;

public class AnimalOrder : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid ResearchGroupId { get; set; }
    public Guid EthicsApprovalId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    public string Species { get; set; } = string.Empty;
    public string Strain { get; set; } = string.Empty;
    public Gender Gender { get; set; } = Gender.Unknown;
    public int AgeWeeks { get; set; }
    public string? WeightRange { get; set; }
    public int Quantity { get; set; }
    public string? Supplier { get; set; }
    public string? VendorLicenseNumber { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? Purpose { get; set; }
    public string? SpecialRequirements { get; set; }
    public string? RejectionReason { get; set; }

    public ResearchGroup? ResearchGroup { get; set; }
    public EthicsApproval? EthicsApproval { get; set; }
    public ICollection<AnimalBatch> AnimalBatches { get; set; } = new List<AnimalBatch>();
}
