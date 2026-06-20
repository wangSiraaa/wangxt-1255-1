import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private API_BASE_URL = 'http://localhost:5103/api';

  constructor(private http: HttpClient) {}

  get<T>(url: string): Observable<ApiResponse<T>> {
    return this.http
      .get(`${this.API_BASE_URL}${url}`)
      .pipe(map((response) => response as ApiResponse<T>));
  }

  post<T>(url: string, body: any): Observable<ApiResponse<T>> {
    return this.http
      .post(`${this.API_BASE_URL}${url}`, body)
      .pipe(map((response) => response as ApiResponse<T>));
  }

  put<T>(url: string, body: any): Observable<ApiResponse<T>> {
    return this.http
      .put(`${this.API_BASE_URL}${url}`, body)
      .pipe(map((response) => response as ApiResponse<T>));
  }

  delete<T>(url: string): Observable<ApiResponse<T>> {
    return this.http
      .delete(`${this.API_BASE_URL}${url}`)
      .pipe(map((response) => response as ApiResponse<T>));
  }
}
