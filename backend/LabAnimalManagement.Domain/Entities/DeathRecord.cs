using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Domain.Entities;

public class DeathRecord : BaseEntity
{
    public string RecordNumber { get; set; } = string.Empty;
    public Guid AnimalBatchId { get; set; }
    public Guid? AnimalId { get; set; }
    public DeathType DeathType { get; set; } = DeathType.Normal;
    public DateTime DeathDate { get; set; }
    public int DeathCount { get; set; } = 1;
    public string? ReportedBy { get; set; }
    public DateTime ReportedDate { get; set; }
    public string? SuspectedCause { get; set; }
    public string? ClinicalSigns { get; set; }
    public bool NecropsyPerformed { get; set; } = false;
    public string? NecropsyFindings { get; set; }
    public string? LabResults { get; set; }
    public string? DisposalMethod { get; set; }
    public string? Remarks { get; set; }
    public Guid? InvestigationId { get; set; }

    public AnimalBatch? AnimalBatch { get; set; }
    public Animal? Animal { get; set; }
    public DeathInvestigation? Investigation { get; set; }
}
