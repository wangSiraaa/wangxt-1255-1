namespace LabAnimalManagement.Application.DTOs;

public class CageAllocationDto
{
    public Guid Id { get; set; }
    public Guid AnimalBatchId { get; set; }
    public string? BatchNumber { get; set; }
    public Guid CageLocationId { get; set; }
    public string? LocationCode { get; set; }
    public string? LocationDisplay { get; set; }
    public int AnimalCount { get; set; }
    public DateTime AllocationDate { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string? AllocatedBy { get; set; }
    public string? Remarks { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCageAllocationDto
{
    public Guid AnimalBatchId { get; set; }
    public Guid CageLocationId { get; set; }
    public int AnimalCount { get; set; }
    public string? AllocatedBy { get; set; }
    public string? Remarks { get; set; }
}

public class ReleaseCageAllocationDto
{
    public DateTime ReleaseDate { get; set; } = DateTime.UtcNow;
    public string? Remarks { get; set; }
}
