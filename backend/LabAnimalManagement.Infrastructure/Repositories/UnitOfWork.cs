using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Interfaces;
using LabAnimalManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace LabAnimalManagement.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly LabAnimalDbContext _context;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(LabAnimalDbContext context)
    {
        _context = context;
        ResearchGroups = new Repository<ResearchGroup>(_context);
        EthicsApprovals = new Repository<EthicsApproval>(_context);
        AnimalOrders = new Repository<AnimalOrder>(_context);
        AnimalBatches = new Repository<AnimalBatch>(_context);
        Animals = new Repository<Animal>(_context);
        CageLocations = new Repository<CageLocation>(_context);
        CageAllocations = new Repository<CageAllocation>(_context);
        QuarantineRecords = new Repository<QuarantineRecord>(_context);
        DeathRecords = new Repository<DeathRecord>(_context);
        DeathInvestigations = new Repository<DeathInvestigation>(_context);
    }

    public IRepository<ResearchGroup> ResearchGroups { get; private set; }
    public IRepository<EthicsApproval> EthicsApprovals { get; private set; }
    public IRepository<AnimalOrder> AnimalOrders { get; private set; }
    public IRepository<AnimalBatch> AnimalBatches { get; private set; }
    public IRepository<Animal> Animals { get; private set; }
    public IRepository<CageLocation> CageLocations { get; private set; }
    public IRepository<CageAllocation> CageAllocations { get; private set; }
    public IRepository<QuarantineRecord> QuarantineRecords { get; private set; }
    public IRepository<DeathRecord> DeathRecords { get; private set; }
    public IRepository<DeathInvestigation> DeathInvestigations { get; private set; }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
