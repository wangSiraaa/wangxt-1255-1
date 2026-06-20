import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  PagedQueryParams,
  PagedResult,
  EthicsApproval,
  EthicsApprovalCreateDto,
  EthicsApprovalUpdateDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class EthicsApprovalService {
  private readonly baseUrl = '/ethicsapproval';

  constructor(private apiService: ApiService) {}

  getPaged(params: PagedQueryParams): Observable<ApiResponse<PagedResult<EthicsApproval>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.apiService.get<PagedResult<EthicsApproval>>(`${this.baseUrl}/paged?${query}`);
  }

  getById(id: string): Observable<ApiResponse<EthicsApproval>> {
    return this.apiService.get<EthicsApproval>(`${this.baseUrl}/${id}`);
  }

  getByResearchGroup(researchGroupId: string): Observable<ApiResponse<EthicsApproval[]>> {
    return this.apiService.get<EthicsApproval[]>(`${this.baseUrl}/by-research-group/${researchGroupId}`);
  }

  checkValidity(id: string): Observable<ApiResponse<boolean>>> {
    return this.apiService.get<boolean>(`${this.baseUrl}/${id}/check-validity`);
  }

  getUsedCount(id: string): Observable<ApiResponse<number>>> {
    return this.apiService.get<number>(`${this.baseUrl}/${id}/used-count`);
  }

  create(dto: EthicsApprovalCreateDto): Observable<ApiResponse<EthicsApproval>> {
    return this.apiService.post<EthicsApproval>(this.baseUrl, dto);
  }

  update(id: string, dto: EthicsApprovalUpdateDto): Observable<ApiResponse<EthicsApproval>> {
    return this.apiService.put<EthicsApproval>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`${this.baseUrl}/${id}`);
  }
}
