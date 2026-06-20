using LabAnimalManagement.API.Middleware;
using LabAnimalManagement.Application;
using LabAnimalManagement.Infrastructure;
using LabAnimalManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "高校实验动物房管理系统 API",
        Version = "v1",
        Description = "管理动物订购、笼位分配、伦理批件、检疫和异常死亡记录的 RESTful API",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "实验室管理系统"
        }
    });
    c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "LabAnimalManagement.API.xml"));
    c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "LabAnimalManagement.Application.xml"));
});

builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApplicationServices();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<LabAnimalDbContext>();
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        context.Database.Migrate();
        await DbInitializer.SeedDataAsync(context);
        logger.LogInformation("Database migration and seed completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while migrating or seeding the database.");
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Lab Animal Management API v1");
    });
}

app.UseCors("AllowAngular");

app.UseAuthorization();

app.MapControllers();

app.Run();
