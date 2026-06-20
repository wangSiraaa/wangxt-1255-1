using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Application.DTOs;

public class CageLocationDto
{
    public Guid Id { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public string? Rack { get; set; }
    public string? Position { get; set; }
    public string? BarrierLevel { get; set; }
    public int MaxCapacity { get; set; }
    public int CurrentOccupancy { get; set; }
    public CageStatus Status { get; set; }
    public string? Remarks { get; set; }
    public int AvailableCapacity => MaxCapacity - CurrentOccupancy;
    public bool HasAvailableCapacity => CurrentOccupancy < MaxCapacity;
}

public class CreateCageLocationDto
{
    public string LocationCode { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public string? Rack { get; set; }
    public string? Position { get; set; }
    public string? BarrierLevel { get; set; }
    public int MaxCapacity { get; set; }
    public CageStatus Status { get; set; } = CageStatus.Available;
    public string? Remarks { get; set; }
}

public class UpdateCageLocationDto
{
    public string LocationCode { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public string? Rack { get; set; }
    public string? Position { get; set; }
    public string? BarrierLevel { get; set; }
    public int MaxCapacity { get; set; }
    public CageStatus Status { get; set; }
    public string? Remarks { get; set; }
}
