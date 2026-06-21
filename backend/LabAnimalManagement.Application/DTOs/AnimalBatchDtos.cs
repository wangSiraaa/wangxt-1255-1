using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Application.DTOs;

public class AnimalBatchDto
{
    public Guid Id { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public Guid ResearchGroupId { get; set; }
    public string? ResearchGroupName { get; set; }
    public Guid? AnimalOrderId { get; set; }
    public string? OrderNumber { get; set; }
    public BatchStatus Status { get; set; }
    public string Species { get; set; } = string.Empty;
    public string Strain { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public int AgeWeeks { get; set; }
    public string? WeightRange { get; set; }
    public int TotalCount { get; set; }
    public int CurrentCount { get; set; }
    public int DeathCount { get; set; }
    public DateTime EntryDate { get; set; }
    public DateTime? ExitDate { get; set; }
    public string? Source { get; set; }
    public string? CertificateNumber { get; set; }
    public string? HealthStatus { get; set; }
    public string? Remarks { get; set; }
    public bool CanClose { get; set; }
    public int CageOccupancyCount { get; set; }
    public string? EthicsApprovalNumber { get; set; }
    public DateTime? EthicsApprovalExpiryDate { get; set; }
    public int? EthicsApprovalRemainingDays { get; set; }
}

public class CreateAnimalBatchDto
{
    public Guid ResearchGroupId { get; set; }
    public Guid? AnimalOrderId { get; set; }
    public string Species { get; set; } = string.Empty;
    public string Strain { get; set; } = string.Empty;
    public Gender Gender { get; set; } = Gender.Unknown;
    public int AgeWeeks { get; set; }
    public string? WeightRange { get; set; }
    public int TotalCount { get; set; }
    public DateTime EntryDate { get; set; } = DateTime.UtcNow;
    public string? Source { get; set; }
    public string? CertificateNumber { get; set; }
    public string? HealthStatus { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateAnimalBatchDto
{
    public string? Source { get; set; }
    public string? CertificateNumber { get; set; }
    public string? HealthStatus { get; set; }
    public string? Remarks { get; set; }
}

public class CloseBatchDto
{
    public string? Remarks { get; set; }
}
