import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  PagedQueryParams,
  PagedResult,
  AnimalOrder,
  AnimalOrderCreateDto,
  AnimalOrderUpdateDto,
  AnimalOrderApproveDto,
  AnimalOrderRejectDto,
  AnimalOrderReceiveDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class AnimalOrderService {
  private readonly baseUrl = '/animalorder';

  constructor(private apiService: ApiService) {}

  getPaged(params: PagedQueryParams): Observable<ApiResponse<PagedResult<AnimalOrder>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.apiService.get<PagedResult<AnimalOrder>>(`${this.baseUrl}/paged?${query}`);
  }

  getById(id: string): Observable<ApiResponse<AnimalOrder>> {
    return this.apiService.get<AnimalOrder>(`${this.baseUrl}/${id}`);
  }

  create(dto: AnimalOrderCreateDto): Observable<ApiResponse<AnimalOrder>> {
    return this.apiService.post<AnimalOrder>(this.baseUrl, dto);
  }

  update(id: string, dto: AnimalOrderUpdateDto): Observable<ApiResponse<AnimalOrder>> {
    return this.apiService.put<AnimalOrder>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`${this.baseUrl}/${id}`);
  }

  submit(id: string): Observable<ApiResponse<AnimalOrder>> {
    return this.apiService.post<AnimalOrder>(`${this.baseUrl}/${id}/submit`, null);
  }

  approve(id: string, dto: AnimalOrderApproveDto): Observable<ApiResponse<AnimalOrder>> {
    return this.apiService.post<AnimalOrder>(`${this.baseUrl}/${id}/approve`, dto);
  }

  reject(id: string, dto: AnimalOrderRejectDto): Observable<ApiResponse<AnimalOrder>> {
    return this.apiService.post<AnimalOrder>(`${this.baseUrl}/${id}/reject`, dto);
  }

  markInTransit(id: string): Observable<ApiResponse<AnimalOrder>> {
    return this.apiService.post<AnimalOrder>(`${this.baseUrl}/${id}/mark-in-transit`, null);
  }

  receive(id: string, dto: AnimalOrderReceiveDto): Observable<ApiResponse<AnimalOrder>> {
    return this.apiService.post<AnimalOrder>(`${this.baseUrl}/${id}/receive`, dto);
  }
}
