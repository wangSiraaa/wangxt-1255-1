import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  PagedQueryParams,
  PagedResult,
  CageLocation,
  CageLocationCreateDto,
  CageLocationUpdateDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class CageLocationService {
  private readonly baseUrl = '/cagelocation';

  constructor(private apiService: ApiService) {}

  getPaged(params: PagedQueryParams): Observable<ApiResponse<PagedResult<CageLocation>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.apiService.get<PagedResult<CageLocation>>(`${this.baseUrl}/paged?${query}`);
  }

  getById(id: string): Observable<ApiResponse<CageLocation>> {
    return this.apiService.get<CageLocation>(`${this.baseUrl}/${id}`);
  }

  getAvailable(requiredCapacity: number): Observable<ApiResponse<CageLocation[]>> {
    return this.apiService.get<CageLocation[]>(`${this.baseUrl}/available?requiredCapacity=${requiredCapacity}`);
  }

  create(dto: CageLocationCreateDto): Observable<ApiResponse<CageLocation>> {
    return this.apiService.post<CageLocation>(this.baseUrl, dto);
  }

  update(id: string, dto: CageLocationUpdateDto): Observable<ApiResponse<CageLocation>> {
    return this.apiService.put<CageLocation>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`${this.baseUrl}/${id}`);
  }
}
