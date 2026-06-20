using LabAnimalManagement.Domain.Enums;

namespace LabAnimalManagement.Application.DTOs;

public class QuarantineRecordDto
{
    public Guid Id { get; set; }
    public string RecordNumber { get; set; } = string.Empty;
    public Guid AnimalBatchId { get; set; }
    public string? BatchNumber { get; set; }
    public Guid CageLocationId { get; set; }
    public string? LocationCode { get; set; }
    public string? VeterinarianId { get; set; }
    public string? VeterinarianName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int DurationDays { get; set; }
    public bool Passed { get; set; }
    public string? Observations { get; set; }
    public string? ClinicalSigns { get; set; }
    public string? LabResults { get; set; }
    public string? TreatmentGiven { get; set; }
    public string? Conclusion { get; set; }
    public string? Remarks { get; set; }
}

public class CreateQuarantineRecordDto
{
    public Guid AnimalBatchId { get; set; }
    public Guid CageLocationId { get; set; }
    public string? VeterinarianId { get; set; }
    public string? VeterinarianName { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public int DurationDays { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateQuarantineRecordDto
{
    public DateTime? EndDate { get; set; }
    public bool Passed { get; set; }
    public string? Observations { get; set; }
    public string? ClinicalSigns { get; set; }
    public string? LabResults { get; set; }
    public string? TreatmentGiven { get; set; }
    public string? Conclusion { get; set; }
    public string? Remarks { get; set; }
}

public class CompleteQuarantineDto
{
    public DateTime EndDate { get; set; } = DateTime.UtcNow;
    public bool Passed { get; set; }
    public string? Observations { get; set; }
    public string? ClinicalSigns { get; set; }
    public string? LabResults { get; set; }
    public string? TreatmentGiven { get; set; }
    public string Conclusion { get; set; } = string.Empty;
}

public class DeathRecordDto
{
    public Guid Id { get; set; }
    public string RecordNumber { get; set; } = string.Empty;
    public Guid AnimalBatchId { get; set; }
    public string? BatchNumber { get; set; }
    public Guid? AnimalId { get; set; }
    public string? AnimalNumber { get; set; }
    public DeathType DeathType { get; set; }
    public DateTime DeathDate { get; set; }
    public int DeathCount { get; set; }
    public string? ReportedBy { get; set; }
    public DateTime ReportedDate { get; set; }
    public string? SuspectedCause { get; set; }
    public string? ClinicalSigns { get; set; }
    public bool NecropsyPerformed { get; set; }
    public string? NecropsyFindings { get; set; }
    public string? LabResults { get; set; }
    public string? DisposalMethod { get; set; }
    public string? Remarks { get; set; }
    public Guid? InvestigationId { get; set; }
    public string? InvestigationNumber { get; set; }
    public InvestigationStatus? InvestigationStatus { get; set; }
}

public class CreateDeathRecordDto
{
    public Guid AnimalBatchId { get; set; }
    public Guid? AnimalId { get; set; }
    public DeathType DeathType { get; set; } = DeathType.Normal;
    public DateTime DeathDate { get; set; } = DateTime.UtcNow;
    public int DeathCount { get; set; } = 1;
    public string? ReportedBy { get; set; }
    public string? SuspectedCause { get; set; }
    public string? ClinicalSigns { get; set; }
    public bool NecropsyPerformed { get; set; }
    public string? NecropsyFindings { get; set; }
    public string? LabResults { get; set; }
    public string? DisposalMethod { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateDeathRecordDto
{
    public DeathType DeathType { get; set; }
    public string? SuspectedCause { get; set; }
    public string? ClinicalSigns { get; set; }
    public bool NecropsyPerformed { get; set; }
    public string? NecropsyFindings { get; set; }
    public string? LabResults { get; set; }
    public string? DisposalMethod { get; set; }
    public string? Remarks { get; set; }
}

public class DeathInvestigationDto
{
    public Guid Id { get; set; }
    public string InvestigationNumber { get; set; } = string.Empty;
    public InvestigationStatus Status { get; set; }
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
    public List<DeathRecordBriefDto>? RelatedDeathRecords { get; set; }
}

public class DeathRecordBriefDto
{
    public Guid Id { get; set; }
    public string RecordNumber { get; set; } = string.Empty;
    public DateTime DeathDate { get; set; }
    public int DeathCount { get; set; }
    public string? BatchNumber { get; set; }
}

public class CreateDeathInvestigationDto
{
    public List<Guid> DeathRecordIds { get; set; } = new();
    public string? InvestigatorId { get; set; }
    public string? InvestigatorName { get; set; }
    public string? TeamMembers { get; set; }
    public string? Background { get; set; }
    public string? InvestigationMethod { get; set; }
    public DateTime? FollowUpDate { get; set; }
}

public class UpdateDeathInvestigationDto
{
    public InvestigationStatus Status { get; set; }
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
}

public class CompleteInvestigationDto
{
    public DateTime CompletedDate { get; set; } = DateTime.UtcNow;
    public string Findings { get; set; } = string.Empty;
    public string RootCause { get; set; } = string.Empty;
    public string? CorrectiveActions { get; set; }
    public string? PreventiveMeasures { get; set; }
    public string Conclusion { get; set; } = string.Empty;
}
