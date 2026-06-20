using LabAnimalManagement.Domain.Entities;

namespace LabAnimalManagement.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<ResearchGroup> ResearchGroups { get; }
    IRepository<EthicsApproval> EthicsApprovals { get; }
    IRepository<AnimalOrder> AnimalOrders { get; }
    IRepository<AnimalBatch> AnimalBatches { get; }
    IRepository<Animal> Animals { get; }
    IRepository<CageLocation> CageLocations { get; }
    IRepository<CageAllocation> CageAllocations { get; }
    IRepository<QuarantineRecord> QuarantineRecords { get; }
    IRepository<DeathRecord> DeathRecords { get; }
    IRepository<DeathInvestigation> DeathInvestigations { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
