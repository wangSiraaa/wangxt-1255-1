namespace LabAnimalManagement.Domain.Enums;

public enum BatchStatus
{
    PendingQuarantine = 0,
    InQuarantine = 1,
    QuarantinePassed = 2,
    InUse = 3,
    Completed = 4,
    Closed = 5
}
