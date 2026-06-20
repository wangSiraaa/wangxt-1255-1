namespace LabAnimalManagement.Domain.Entities;

public class QuarantineRecord : BaseEntity
{
    public string RecordNumber { get; set; } = string.Empty;
    public Guid AnimalBatchId { get; set; }
    public Guid CageLocationId { get; set; }
    public string? VeterinarianId { get; set; }
    public string? VeterinarianName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int DurationDays { get; set; }
    public bool Passed { get; set; } = false;
    public string? Observations { get; set; }
    public string? ClinicalSigns { get; set; }
    public string? LabResults { get; set; }
    public string? TreatmentGiven { get; set; }
    public string? Conclusion { get; set; }
    public string? Remarks { get; set; }

    public AnimalBatch? AnimalBatch { get; set; }
    public CageLocation? CageLocation { get; set; }
}
