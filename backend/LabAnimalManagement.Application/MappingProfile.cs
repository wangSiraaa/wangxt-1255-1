using AutoMapper;
using LabAnimalManagement.Application.DTOs;
using LabAnimalManagement.Domain.Entities;

namespace LabAnimalManagement.Application;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<ResearchGroup, ResearchGroupDto>();
        CreateMap<CreateResearchGroupDto, ResearchGroup>();
        CreateMap<UpdateResearchGroupDto, ResearchGroup>();
    }
}
