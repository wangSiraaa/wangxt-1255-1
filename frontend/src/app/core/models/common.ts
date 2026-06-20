export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export interface PagedQueryParams {
  pageIndex: number;
  pageSize: number;
  sortField: string;
  sortDirection: string;
  searchKeyword: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  createdBy?: string;
  updatedAt?: Date | string;
  updatedBy?: string;
  isDeleted: boolean;
}
