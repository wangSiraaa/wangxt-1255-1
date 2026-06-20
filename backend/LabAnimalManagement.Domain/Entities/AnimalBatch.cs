using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Domain.Entities;

public class AnimalBatch : BaseEntity
{
    public string BatchNumber { get; set; } = string.Empty;
    public Guid ResearchGroupId { get; set; }
    public Guid? AnimalOrderId { get; set; }
    public string Species { get; set; } = string.Empty;
    public string Strain { get; set; } = string.Empty;
    public Gender Gender { get; set; } = Gender.Unknown;
    public int AgeWeeks { get; set; }
    public string? WeightRange { get; set; }
    public int TotalCount { get; set; }
    public int CurrentCount { get; set; }
    public int DeathCount { get; set; } = 0;
    public BatchStatus Status { get; set; } = BatchStatus.PendingQuarantine;
    public DateTime EntryDate { get; set; }
    public DateTime? ExitDate { get; set; }
    public string? Source { get; set; }
    public string? CertificateNumber { get; set; }
    public string? HealthStatus { get; set; }
    public string? Remarks { get; set; }

    public ResearchGroup? ResearchGroup { get; set; }
    public AnimalOrder? AnimalOrder { get; set; }
    public ICollection<Animal> Animals { get; set; } = new List<Animal>();
    public ICollection<CageAllocation> CageAllocations { get; set; } = new List<CageAllocation>();
    public ICollection<QuarantineRecord> QuarantineRecords { get; set; } = new List<QuarantineRecord>();
    public ICollection<DeathRecord> DeathRecords { get; set; } = new List<DeathRecord>();

    public bool CanClose()
    {
        var pendingInvestigations = DeathRecords
            .Where(d => d.DeathType == DeathType.Abnormal && d.Investigation != null)
            .Any(d => d.Investigation!.Status != InvestigationStatus.Completed 
                     && d.Investigation!.Status != InvestigationStatus.Closed);
        
        return !pendingInvestigations && CurrentCount == 0;
    }
}
