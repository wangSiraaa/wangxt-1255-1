using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Domain.Entities;

public class DeathInvestigation : BaseEntity
{
    public string InvestigationNumber { get; set; } = string.Empty;
    public InvestigationStatus Status { get; set; } = InvestigationStatus.Pending;
    public DateTime StartDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string? InvestigatorId { get; set; }
    public string? InvestigatorName { get; set; }
    public string? TeamMembers { get; set; }
    public string? Background { get; set; }
    public string? InvestigationMethod { get; set; }
    public string? Findings { get; set; }
    public string? RootCause { get; set; }
    public string? CorrectiveActions { get; set; }
    public string? PreventiveMeasures { get; set; }
    public string? Conclusion { get; set; }
    public string? Remarks { get; set; }
    public DateTime? FollowUpDate { get; set; }

    public ICollection<DeathRecord> DeathRecords { get; set; } = new List<DeathRecord>();
}
