import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  PagedQueryParams,
  PagedResult,
  QuarantineRecord,
  QuarantineRecordCreateDto,
  QuarantineRecordUpdateDto,
  QuarantineRecordCompleteDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class QuarantineService {
  private readonly baseUrl = '/quarantine';

  constructor(private apiService: ApiService) {}

  getPaged(params: PagedQueryParams): Observable<ApiResponse<PagedResult<QuarantineRecord>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.apiService.get<PagedResult<QuarantineRecord>>(`${this.baseUrl}/paged?${query}`);
  }

  getById(id: string): Observable<ApiResponse<QuarantineRecord>> {
    return this.apiService.get<QuarantineRecord>(`${this.baseUrl}/${id}`);
  }

  getByBatch(batchId: string): Observable<ApiResponse<QuarantineRecord[]>> {
    return this.apiService.get<QuarantineRecord[]>(`${this.baseUrl}/by-batch/${batchId}`);
  }

  start(dto: QuarantineRecordCreateDto): Observable<ApiResponse<QuarantineRecord>> {
    return this.apiService.post<QuarantineRecord>(`${this.baseUrl}/start`, dto);
  }

  update(id: string, dto: QuarantineRecordUpdateDto): Observable<ApiResponse<QuarantineRecord>> {
    return this.apiService.put<QuarantineRecord>(`${this.baseUrl}/${id}`, dto);
  }

  complete(id: string, dto: QuarantineRecordCompleteDto): Observable<ApiResponse<QuarantineRecord>> {
    return this.apiService.post<QuarantineRecord>(`${this.baseUrl}/${id}/complete`, dto);
  }
}
