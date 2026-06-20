import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  CageAllocation,
  CageAllocationCreateDto,
  CageAllocationReleaseDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class CageAllocationService {
  private readonly baseUrl = '/cageallocation';

  constructor(private apiService: ApiService) {}

  getByBatch(batchId: string): Observable<ApiResponse<CageAllocation[]>> {
    return this.apiService.get<CageAllocation[]>(`${this.baseUrl}/by-batch/${batchId}`);
  }

  getByCage(cageId: string): Observable<ApiResponse<CageAllocation[]>> {
    return this.apiService.get<CageAllocation[]>(`${this.baseUrl}/by-cage/${cageId}`);
  }

  allocate(dto: CageAllocationCreateDto): Observable<ApiResponse<CageAllocation>> {
    return this.apiService.post<CageAllocation>(`${this.baseUrl}/allocate`, dto);
  }

  release(allocationId: string, dto: CageAllocationReleaseDto): Observable<ApiResponse<CageAllocation>> {
    return this.apiService.post<CageAllocation>(`${this.baseUrl}/${allocationId}/release`, dto);
  }
}
