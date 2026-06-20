using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace LabAnimalManagement.Infrastructure.Data;

public class LabAnimalDbContext : DbContext
{
    public LabAnimalDbContext(DbContextOptions<LabAnimalDbContext> options) 
        : base(options)
    {
    }

    public DbSet<ResearchGroup> ResearchGroups { get; set; }
    public DbSet<EthicsApproval> EthicsApprovals { get; set; }
    public DbSet<AnimalOrder> AnimalOrders { get; set; }
    public DbSet<AnimalBatch> AnimalBatches { get; set; }
    public DbSet<Animal> Animals { get; set; }
    public DbSet<CageLocation> CageLocations { get; set; }
    public DbSet<CageAllocation> CageAllocations { get; set; }
    public DbSet<QuarantineRecord> QuarantineRecords { get; set; }
    public DbSet<DeathRecord> DeathRecords { get; set; }
    public DbSet<DeathInvestigation> DeathInvestigations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property<bool>("IsDeleted")
                    .HasDefaultValue(false);
                
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(CreateIsDeletedFilter(entityType.ClrType));
            }
        }

        ConfigureResearchGroup(modelBuilder);
        ConfigureEthicsApproval(modelBuilder);
        ConfigureAnimalOrder(modelBuilder);
        ConfigureAnimalBatch(modelBuilder);
        ConfigureAnimal(modelBuilder);
        ConfigureCageLocation(modelBuilder);
        ConfigureCageAllocation(modelBuilder);
        ConfigureQuarantineRecord(modelBuilder);
        ConfigureDeathRecord(modelBuilder);
        ConfigureDeathInvestigation(modelBuilder);
    }

    private static System.Linq.Expressions.LambdaExpression CreateIsDeletedFilter(Type type)
    {
        var param = System.Linq.Expressions.Expression.Parameter(type, "e");
        var body = System.Linq.Expressions.Expression.Equal(
            System.Linq.Expressions.Expression.Property(param, "IsDeleted"),
            System.Linq.Expressions.Expression.Constant(false));
        return System.Linq.Expressions.Expression.Lambda(body, param);
    }

    private static void ConfigureResearchGroup(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ResearchGroup>(entity =>
        {
            entity.HasIndex(e => e.GroupCode).IsUnique();
            entity.Property(e => e.GroupCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.GroupName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.PrincipalInvestigator).HasMaxLength(100);
            entity.Property(e => e.ContactPhone).HasMaxLength(20);
            entity.Property(e => e.ContactEmail).HasMaxLength(100);
            entity.Property(e => e.Department).HasMaxLength(200);
        });
    }

    private static void ConfigureEthicsApproval(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EthicsApproval>(entity =>
        {
            entity.HasIndex(e => e.ApprovalNumber).IsUnique();
            entity.Property(e => e.ApprovalNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();
            entity.Property(e => e.ApprovedBy).HasMaxLength(100);
            entity.Property(e => e.SpeciesAllowed).HasMaxLength(500);
            entity.Property(e => e.ApprovalDocumentPath).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasConversion<EnumToNumberConverter<EthicsApprovalStatus, int>>();
            
            entity.HasOne(e => e.ResearchGroup)
                  .WithMany(r => r.EthicsApprovals)
                  .HasForeignKey(e => e.ResearchGroupId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureAnimalOrder(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AnimalOrder>(entity =>
        {
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.Property(e => e.OrderNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Species).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Strain).HasMaxLength(100).IsRequired();
            entity.Property(e => e.WeightRange).HasMaxLength(50);
            entity.Property(e => e.Supplier).HasMaxLength(200);
            entity.Property(e => e.VendorLicenseNumber).HasMaxLength(100);
            entity.Property(e => e.Purpose).HasMaxLength(500);
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasConversion<EnumToNumberConverter<OrderStatus, int>>();
            entity.Property(e => e.Gender)
                .HasConversion<EnumToNumberConverter<Gender, int>>();

            entity.HasOne(e => e.ResearchGroup)
                  .WithMany(r => r.AnimalOrders)
                  .HasForeignKey(e => e.ResearchGroupId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.EthicsApproval)
                  .WithMany(ea => ea.AnimalOrders)
                  .HasForeignKey(e => e.EthicsApprovalId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureAnimalBatch(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AnimalBatch>(entity =>
        {
            entity.HasIndex(e => e.BatchNumber).IsUnique();
            entity.Property(e => e.BatchNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Species).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Strain).HasMaxLength(100).IsRequired();
            entity.Property(e => e.WeightRange).HasMaxLength(50);
            entity.Property(e => e.Source).HasMaxLength(200);
            entity.Property(e => e.CertificateNumber).HasMaxLength(100);
            entity.Property(e => e.HealthStatus).HasMaxLength(200);
            entity.Property(e => e.Status)
                .HasConversion<EnumToNumberConverter<BatchStatus, int>>();
            entity.Property(e => e.Gender)
                .HasConversion<EnumToNumberConverter<Gender, int>>();

            entity.HasOne(e => e.ResearchGroup)
                  .WithMany(r => r.AnimalBatches)
                  .HasForeignKey(e => e.ResearchGroupId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AnimalOrder)
                  .WithMany(o => o.AnimalBatches)
                  .HasForeignKey(e => e.AnimalOrderId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureAnimal(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Animal>(entity =>
        {
            entity.HasIndex(e => e.AnimalNumber).IsUnique();
            entity.Property(e => e.AnimalNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Species).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Strain).HasMaxLength(100).IsRequired();
            entity.Property(e => e.EarTag).HasMaxLength(50);
            entity.Property(e => e.MicrochipId).HasMaxLength(50);
            entity.Property(e => e.ColorMarking).HasMaxLength(100);
            entity.Property(e => e.HealthStatus).HasMaxLength(200);
            entity.Property(e => e.Weight).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Gender)
                .HasConversion<EnumToNumberConverter<Gender, int>>();

            entity.HasOne(e => e.AnimalBatch)
                  .WithMany(b => b.Animals)
                  .HasForeignKey(e => e.AnimalBatchId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCageLocation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CageLocation>(entity =>
        {
            entity.HasIndex(e => e.LocationCode).IsUnique();
            entity.Property(e => e.LocationCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Building).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Floor).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Room).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Rack).HasMaxLength(20);
            entity.Property(e => e.Position).HasMaxLength(20);
            entity.Property(e => e.BarrierLevel).HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasConversion<EnumToNumberConverter<CageStatus, int>>();
        });
    }

    private static void ConfigureCageAllocation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CageAllocation>(entity =>
        {
            entity.HasOne(e => e.AnimalBatch)
                  .WithMany(b => b.CageAllocations)
                  .HasForeignKey(e => e.AnimalBatchId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CageLocation)
                  .WithMany(c => c.CageAllocations)
                  .HasForeignKey(e => e.CageLocationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.AllocatedBy).HasMaxLength(100);
        });
    }

    private static void ConfigureQuarantineRecord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<QuarantineRecord>(entity =>
        {
            entity.HasIndex(e => e.RecordNumber).IsUnique();
            entity.Property(e => e.RecordNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.VeterinarianId).HasMaxLength(100);
            entity.Property(e => e.VeterinarianName).HasMaxLength(100);

            entity.HasOne(e => e.AnimalBatch)
                  .WithMany(b => b.QuarantineRecords)
                  .HasForeignKey(e => e.AnimalBatchId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CageLocation)
                  .WithMany(c => c.QuarantineRecords)
                  .HasForeignKey(e => e.CageLocationId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureDeathRecord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DeathRecord>(entity =>
        {
            entity.HasIndex(e => e.RecordNumber).IsUnique();
            entity.Property(e => e.RecordNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ReportedBy).HasMaxLength(100);
            entity.Property(e => e.SuspectedCause).HasMaxLength(500);
            entity.Property(e => e.DisposalMethod).HasMaxLength(200);
            entity.Property(e => e.DeathType)
                .HasConversion<EnumToNumberConverter<DeathType, int>>();

            entity.HasOne(e => e.AnimalBatch)
                  .WithMany(b => b.DeathRecords)
                  .HasForeignKey(e => e.AnimalBatchId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Animal)
                  .WithMany(a => a.DeathRecords)
                  .HasForeignKey(e => e.AnimalId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Investigation)
                  .WithMany(i => i.DeathRecords)
                  .HasForeignKey(e => e.InvestigationId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureDeathInvestigation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DeathInvestigation>(entity =>
        {
            entity.HasIndex(e => e.InvestigationNumber).IsUnique();
            entity.Property(e => e.InvestigationNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.InvestigatorId).HasMaxLength(100);
            entity.Property(e => e.InvestigatorName).HasMaxLength(100);
            entity.Property(e => e.Status)
                .HasConversion<EnumToNumberConverter<InvestigationStatus, int>>();
        });
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries<BaseEntity>();
        
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}
