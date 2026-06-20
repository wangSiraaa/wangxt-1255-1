import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  PagedQueryParams,
  PagedResult,
  DeathRecord,
  DeathRecordCreateDto,
  DeathRecordUpdateDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class DeathRecordService {
  private readonly baseUrl = '/deathrecord';

  constructor(private apiService: ApiService) {}

  getPaged(params: PagedQueryParams): Observable<ApiResponse<PagedResult<DeathRecord>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.apiService.get<PagedResult<DeathRecord>>(`${this.baseUrl}/paged?${query}`);
  }

  getById(id: string): Observable<ApiResponse<DeathRecord>> {
    return this.apiService.get<DeathRecord>(`${this.baseUrl}/${id}`);
  }

  getByBatch(batchId: string): Observable<ApiResponse<DeathRecord[]>> {
    return this.apiService.get<DeathRecord[]>(`${this.baseUrl}/by-batch/${batchId}`);
  }

  getAbnormalUninvestigated(): Observable<ApiResponse<DeathRecord[]>> {
    return this.apiService.get<DeathRecord[]>(`${this.baseUrl}/abnormal-uninvestigated`);
  }

  create(dto: DeathRecordCreateDto): Observable<ApiResponse<DeathRecord>> {
    return this.apiService.post<DeathRecord>(this.baseUrl, dto);
  }

  update(id: string, dto: DeathRecordUpdateDto): Observable<ApiResponse<DeathRecord>> {
    return this.apiService.put<DeathRecord>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`${this.baseUrl}/${id}`);
  }
}
