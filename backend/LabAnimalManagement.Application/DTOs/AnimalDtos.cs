using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Application.DTOs;

public class AnimalDto
{
    public Guid Id { get; set; }
    public string AnimalNumber { get; set; } = string.Empty;
    public Guid AnimalBatchId { get; set; }
    public string? BatchNumber { get; set; }
    public string Species { get; set; } = string.Empty;
    public string Strain { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public int? AgeWeeks { get; set; }
    public decimal? Weight { get; set; }
    public string? EarTag { get; set; }
    public string? MicrochipId { get; set; }
    public string? ColorMarking { get; set; }
    public bool IsAlive { get; set; }
    public DateTime? DeathDate { get; set; }
    public string? HealthStatus { get; set; }
    public string? Remarks { get; set; }
}

public class CreateAnimalDto
{
    public Guid AnimalBatchId { get; set; }
    public string AnimalNumber { get; set; } = string.Empty;
    public string Species { get; set; } = string.Empty;
    public string Strain { get; set; } = string.Empty;
    public Gender Gender { get; set; } = Gender.Unknown;
    public DateTime? DateOfBirth { get; set; }
    public int? AgeWeeks { get; set; }
    public decimal? Weight { get; set; }
    public string? EarTag { get; set; }
    public string? MicrochipId { get; set; }
    public string? ColorMarking { get; set; }
    public string? HealthStatus { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateAnimalDto
{
    public decimal? Weight { get; set; }
    public string? EarTag { get; set; }
    public string? MicrochipId { get; set; }
    public string? ColorMarking { get; set; }
    public string? HealthStatus { get; set; }
    public string? Remarks { get; set; }
}
