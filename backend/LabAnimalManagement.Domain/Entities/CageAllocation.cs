namespace LabAnimalManagement.Domain.Entities;

public class CageAllocation : BaseEntity
{
    public Guid AnimalBatchId { get; set; }
    public Guid CageLocationId { get; set; }
    public int AnimalCount { get; set; }
    public DateTime AllocationDate { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string? AllocatedBy { get; set; }
    public string? Remarks { get; set; }
    public bool IsActive { get; set; } = true;

    public AnimalBatch? AnimalBatch { get; set; }
    public CageLocation? CageLocation { get; set; }
}
