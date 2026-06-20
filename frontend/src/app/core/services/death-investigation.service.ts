import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  PagedQueryParams,
  PagedResult,
  DeathInvestigation,
  DeathInvestigationCreateDto,
  DeathInvestigationUpdateDto,
  DeathInvestigationCompleteDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class DeathInvestigationService {
  private readonly baseUrl = '/deathinvestigation';

  constructor(private apiService: ApiService) {}

  getPaged(params: PagedQueryParams): Observable<ApiResponse<PagedResult<DeathInvestigation>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.apiService.get<PagedResult<DeathInvestigation>>(`${this.baseUrl}/paged?${query}`);
  }

  getById(id: string): Observable<ApiResponse<DeathInvestigation>> {
    return this.apiService.get<DeathInvestigation>(`${this.baseUrl}/${id}`);
  }

  getByBatch(batchId: string): Observable<ApiResponse<DeathInvestigation[]>> {
    return this.apiService.get<DeathInvestigation[]>(`${this.baseUrl}/by-batch/${batchId}`);
  }

  create(dto: DeathInvestigationCreateDto): Observable<ApiResponse<DeathInvestigation>> {
    return this.apiService.post<DeathInvestigation>(this.baseUrl, dto);
  }

  update(id: string, dto: DeathInvestigationUpdateDto): Observable<ApiResponse<DeathInvestigation>> {
    return this.apiService.put<DeathInvestigation>(`${this.baseUrl}/${id}`, dto);
  }

  complete(id: string, dto: DeathInvestigationCompleteDto): Observable<ApiResponse<DeathInvestigation>> {
    return this.apiService.post<DeathInvestigation>(`${this.baseUrl}/${id}/complete`, dto);
  }

  close(id: string): Observable<ApiResponse<DeathInvestigation>> {
    return this.apiService.post<DeathInvestigation>(`${this.baseUrl}/${id}/close`, null);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`${this.baseUrl}/${id}`);
  }
}
