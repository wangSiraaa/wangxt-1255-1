import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  PagedQueryParams,
  PagedResult,
  AnimalBatch,
  AnimalBatchCreateDto,
  AnimalBatchUpdateDto,
  AnimalBatchCloseDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class AnimalBatchService {
  private readonly baseUrl = '/animalbatch';

  constructor(private apiService: ApiService) {}

  getPaged(params: PagedQueryParams): Observable<ApiResponse<PagedResult<AnimalBatch>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.apiService.get<PagedResult<AnimalBatch>>(`${this.baseUrl}/paged?${query}`);
  }

  getById(id: string): Observable<ApiResponse<AnimalBatch>> {
    return this.apiService.get<AnimalBatch>(`${this.baseUrl}/${id}`);
  }

  getByResearchGroup(researchGroupId: string): Observable<ApiResponse<AnimalBatch[]>> {
    return this.apiService.get<AnimalBatch[]>(`${this.baseUrl}/by-research-group/${researchGroupId}`);
  }

  getActive(): Observable<ApiResponse<AnimalBatch[]>> {
    return this.apiService.get<AnimalBatch[]>(`${this.baseUrl}/active`);
  }

  create(dto: AnimalBatchCreateDto): Observable<ApiResponse<AnimalBatch>> {
    return this.apiService.post<AnimalBatch>(this.baseUrl, dto);
  }

  update(id: string, dto: AnimalBatchUpdateDto): Observable<ApiResponse<AnimalBatch>> {
    return this.apiService.put<AnimalBatch>(`${this.baseUrl}/${id}`, dto);
  }

  close(id: string, dto: AnimalBatchCloseDto): Observable<ApiResponse<AnimalBatch>> {
    return this.apiService.post<AnimalBatch>(`${this.baseUrl}/${id}/close`, dto);
  }
}
