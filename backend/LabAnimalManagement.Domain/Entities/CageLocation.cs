using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Domain.Entities;

public class CageLocation : BaseEntity
{
    public string LocationCode { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public string? Rack { get; set; }
    public string? Position { get; set; }
    public string? BarrierLevel { get; set; }
    public int MaxCapacity { get; set; }
    public int CurrentOccupancy { get; set; } = 0;
    public CageStatus Status { get; set; } = CageStatus.Available;
    public string? Remarks { get; set; }

    public ICollection<CageAllocation> CageAllocations { get; set; } = new List<CageAllocation>();
    public ICollection<QuarantineRecord> QuarantineRecords { get; set; } = new List<QuarantineRecord>();

    public bool HasCapacity(int count = 1)
    {
        return CurrentOccupancy + count <= MaxCapacity;
    }
}
