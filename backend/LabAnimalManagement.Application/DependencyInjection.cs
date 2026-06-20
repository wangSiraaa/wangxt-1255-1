using LabAnimalManagement.Application.Services;
using LabAnimalManagement.Application.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace LabAnimalManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(MappingProfile));

        services.AddScoped<IResearchGroupService, ResearchGroupService>();
        services.AddScoped<IEthicsApprovalService, EthicsApprovalService>();
        services.AddScoped<IAnimalOrderService, AnimalOrderService>();
        services.AddScoped<IAnimalBatchService, AnimalBatchService>();
        services.AddScoped<ICageLocationService, CageLocationService>();
        services.AddScoped<ICageAllocationService, CageAllocationService>();
        services.AddScoped<IQuarantineService, QuarantineService>();
        services.AddScoped<IDeathRecordService, DeathRecordService>();
        services.AddScoped<IDeathInvestigationService, DeathInvestigationService>();

        return services;
    }
}
