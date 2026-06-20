import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  PagedQueryParams,
  PagedResult,
  ResearchGroup,
  ResearchGroupCreateDto,
  ResearchGroupUpdateDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class ResearchGroupService {
  private readonly baseUrl = '/researchgroup';

  constructor(private apiService: ApiService) {}

  getPaged(params: PagedQueryParams): Observable<ApiResponse<PagedResult<ResearchGroup>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.apiService.get<PagedResult<ResearchGroup>>(`${this.baseUrl}/paged?${query}`);
  }

  getById(id: string): Observable<ApiResponse<ResearchGroup>> {
    return this.apiService.get<ResearchGroup>(`${this.baseUrl}/${id}`);
  }

  create(dto: ResearchGroupCreateDto): Observable<ApiResponse<ResearchGroup>> {
    return this.apiService.post<ResearchGroup>(this.baseUrl, dto);
  }

  update(id: string, dto: ResearchGroupUpdateDto): Observable<ApiResponse<ResearchGroup>> {
    return this.apiService.put<ResearchGroup>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`${this.baseUrl}/${id}`);
  }
}
