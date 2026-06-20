using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Application.DTOs;

public class AnimalOrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid ResearchGroupId { get; set; }
    public string? ResearchGroupName { get; set; }
    public Guid EthicsApprovalId { get; set; }
    public string? EthicsApprovalNumber { get; set; }
    public OrderStatus Status { get; set; }
    public string Species { get; set; } = string.Empty;
    public string Strain { get; set; } = string.Empty;
    public Gender Gender { get; set; }
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
    public int ReceivedCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAnimalOrderDto
{
    public Guid ResearchGroupId { get; set; }
    public Guid EthicsApprovalId { get; set; }
    public string Species { get; set; } = string.Empty;
    public string Strain { get; set; } = string.Empty;
    public Gender Gender { get; set; } = Gender.Unknown;
    public int AgeWeeks { get; set; }
    public string? WeightRange { get; set; }
    public int Quantity { get; set; }
    public string? Supplier { get; set; }
    public string? VendorLicenseNumber { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Purpose { get; set; }
    public string? SpecialRequirements { get; set; }
}

public class UpdateAnimalOrderDto
{
    public Guid ResearchGroupId { get; set; }
    public Guid EthicsApprovalId { get; set; }
    public string Species { get; set; } = string.Empty;
    public string Strain { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public int AgeWeeks { get; set; }
    public string? WeightRange { get; set; }
    public int Quantity { get; set; }
    public string? Supplier { get; set; }
    public string? VendorLicenseNumber { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Purpose { get; set; }
    public string? SpecialRequirements { get; set; }
}

public class ApproveOrderDto
{
    public string? ApprovedBy { get; set; }
}

public class RejectOrderDto
{
    public string RejectionReason { get; set; } = string.Empty;
}

public class ReceiveOrderDto
{
    public int ReceivedCount { get; set; }
    public DateTime ActualDeliveryDate { get; set; } = DateTime.UtcNow;
    public string? CertificateNumber { get; set; }
    public string? HealthStatus { get; set; }
    public string? Remarks { get; set; }
}
