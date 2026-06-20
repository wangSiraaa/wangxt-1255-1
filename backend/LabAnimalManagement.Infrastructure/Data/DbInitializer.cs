using LabAnimalManagement.Domain.Entities;
using LabAnimalManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LabAnimalManagement.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedDataAsync(LabAnimalDbContext context)
    {
        if (!context.ResearchGroups.Any())
        {
            var groups = new List<ResearchGroup>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    GroupCode = "RG001",
                    Name = "神经科学研究组",
                    PrincipalInvestigator = "张教授",
                    ContactPhone = "13800000001",
                    ContactEmail = "zhang@university.edu.cn",
                    Department = "生命科学学院",
                    Remarks = "研究神经退行性疾病",
                    CreatedAt = DateTimeOffset.Now,
                    IsDeleted = false
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    GroupCode = "RG002",
                    Name = "肿瘤生物学研究组",
                    PrincipalInvestigator = "李教授",
                    ContactPhone = "13800000002",
                    ContactEmail = "li@university.edu.cn",
                    Department = "医学院",
                    Remarks = "抗肿瘤药物研究",
                    CreatedAt = DateTimeOffset.Now,
                    IsDeleted = false
                }
            };
            await context.ResearchGroups.AddRangeAsync(groups);
            await context.SaveChangesAsync();

            var group1 = groups[0].Id;
            var group2 = groups[1].Id;

            var approvals = new List<EthicsApproval>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    ResearchGroupId = group1,
                    ApprovalNumber = "IACUC-2025-001",
                    Title = "小鼠阿尔茨海默病模型研究",
                    ApprovalDate = new DateTime(2025, 1, 15),
                    EffectiveDate = new DateTime(2025, 1, 15),
                    ExpiryDate = new DateTime(2026, 1, 14),
                    MaximumAnimals = 500,
                    UsedCount = 0,
                    Status = EthicsApprovalStatus.Approved,
                    AnimalTypes = "C57BL/6小鼠, SD大鼠",
                    CreatedAt = DateTimeOffset.Now,
                    IsDeleted = false
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ResearchGroupId = group2,
                    ApprovalNumber = "IACUC-2025-002",
                    Title = "裸鼠异种移植瘤模型研究",
                    ApprovalDate = new DateTime(2025, 2, 20),
                    EffectiveDate = new DateTime(2025, 2, 20),
                    ExpiryDate = new DateTime(2025, 12, 31),
                    MaximumAnimals = 300,
                    UsedCount = 0,
                    Status = EthicsApprovalStatus.Approved,
                    AnimalTypes = "BALB/c裸鼠",
                    CreatedAt = DateTimeOffset.Now,
                    IsDeleted = false
                }
            };
            await context.EthicsApprovals.AddRangeAsync(approvals);
            await context.SaveChangesAsync();
        }

        if (!context.CageLocations.Any())
        {
            var cages = new List<CageLocation>();
            string[] areas = { "A区", "B区", "C区" };
            foreach (var area in areas)
            {
                for (int rack = 1; rack <= 5; rack++)
                {
                    for (int shelf = 1; shelf <= 6; shelf++)
                    {
                        cages.Add(new CageLocation
                        {
                            Id = Guid.NewGuid(),
                            LocationCode = $"{area[0]}-R{rack}-S{shelf}",
                            Name = $"{area} 笼架{rack} 第{shelf}层",
                            Area = area,
                            RackNumber = rack,
                            ShelfLevel = shelf,
                            MaxCapacity = 20,
                            CurrentOccupancy = 0,
                            Status = CageStatus.Available,
                            Notes = string.Empty,
                            CreatedAt = DateTimeOffset.Now,
                            IsDeleted = false
                        });
                    }
                }
            }
            await context.CageLocations.AddRangeAsync(cages);
            await context.SaveChangesAsync();
        }
    }
}
