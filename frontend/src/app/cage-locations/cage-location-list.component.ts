import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CageLocationService, CageAllocationService } from '../core/services';
import { CageLocation, CageStatus, PagedQueryParams, PagedResult } from '../core/models';
import { CageLocationDialogComponent } from './cage-location-dialog.component';

@Component({
  selector: 'app-cage-location-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="toolbar">
        <div class="search-bar">
          <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
            <mat-form-field appearance="outline" class="search-input">
              <mat-label>搜索</mat-label>
              <input matInput formControlName="searchKeyword" placeholder="位置编码/名称/区域" />
              <button mat-icon-button matSuffix (click)="onSearch()" type="button">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
          </form>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon>
            添加笼位
          </button>
        </div>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="cageNumber">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>位置编码</th>
            <td mat-cell *matCellDef="let row">{{ row.cageNumber }}</td>
          </ng-container>

          <ng-container matColumnDef="locationDescription">
            <th mat-header-cell *matHeaderCellDef>名称</th>
            <td mat-cell *matCellDef="let row">{{ row.locationDescription }}</td>
          </ng-container>

          <ng-container matColumnDef="roomNumber">
            <th mat-header-cell *matHeaderCellDef>所在区域</th>
            <td mat-cell *matCellDef="let row">{{ row.roomNumber }}</td>
          </ng-container>

          <ng-container matColumnDef="rackNumber">
            <th mat-header-cell *matHeaderCellDef>笼架号</th>
            <td mat-cell *matCellDef="let row">{{ (row as any).rackNumber || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="shelfLevel">
            <th mat-header-cell *matHeaderCellDef>层级</th>
            <td mat-cell *matCellDef="let row">{{ (row as any).shelfLevel || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="maxCapacity">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>最大容量</th>
            <td mat-cell *matCellDef="let row">{{ row.maxCapacity }}</td>
          </ng-container>

          <ng-container matColumnDef="currentOccupancy">
            <th mat-header-cell *matHeaderCellDef>当前占用</th>
            <td mat-cell *matCellDef="let row">
              <span [class.text-warn]="row.currentOccupancy >= row.maxCapacity">{{ row.currentOccupancy }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="availableCapacity">
            <th mat-header-cell *matHeaderCellDef>可用容量</th>
            <td mat-cell *matCellDef="let row">
              <span [class.text-success]="row.availableCapacity > 0">{{ row.availableCapacity }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>状态</th>
            <td mat-cell *matCellDef="let row">
              <span [class]="getStatusClass(row.status)">{{ getStatusText(row.status) }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button [matMenuTriggerFor]="actionMenu" aria-label="操作">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item (click)="openDialog(row)">
                  <mat-icon>edit</mat-icon>
                  <span>编辑</span>
                </button>
                <button mat-menu-item (click)="deleteLocation(row)" [disabled]="row.currentOccupancy > 0">
                  <mat-icon>delete</mat-icon>
                  <span>删除</span>
                </button>
                <button mat-menu-item (click)="viewAllocationRecords(row)">
                  <mat-icon>list_alt</mat-icon>
                  <span>查看分配记录</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator
          [length]="totalCount"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="[10, 25, 50, 100]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .toolbar { margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .search-bar { flex: 1; }
    .search-input { min-width: 300px; max-width: 500px; }
    .actions { display: flex; gap: 8px; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .text-warn { color: #f44336; font-weight: 600; }
    .text-success { color: #4caf50; font-weight: 600; }
    .status-empty { background: #c8e6c9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-partial { background: #fff9c4; color: #f57f17; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-full { background: #ffcdd2; color: #c62828; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
  `]
})
export class CageLocationListComponent implements OnInit {
  private cageLocationService = inject(CageLocationService);
  private cageAllocationService = inject(CageAllocationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly CageStatus = CageStatus;

  searchForm: FormGroup;
  dataSource = new MatTableDataSource<CageLocation>([]);
  displayedColumns: string[] = [
    'cageNumber', 'locationDescription', 'roomNumber', 'rackNumber',
    'shelfLevel', 'maxCapacity', 'currentOccupancy', 'availableCapacity',
    'status', 'actions'
  ];

  pageIndex = 0;
  pageSize = 25;
  totalCount = 0;
  sortField = 'createdAt';
  sortDirection = 'desc';

  constructor() {
    this.searchForm = this.fb.group({
      searchKeyword: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const params: PagedQueryParams = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortDirection: this.sortDirection,
      searchKeyword: this.searchForm.get('searchKeyword')?.value || '',
    };
    this.cageLocationService.getPaged(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dataSource.data = (res.data as PagedResult<CageLocation>).items;
          this.totalCount = (res.data as PagedResult<CageLocation>).totalCount;
        }
      },
      error: () => this.snackBar.open('加载笼位数据失败', '关闭', { duration: 3000 }),
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadData();
  }

  onSortChange(sort: Sort): void {
    this.sortField = sort.active || 'createdAt';
    this.sortDirection = sort.direction || 'desc';
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  getStatusText(status: CageStatus): string {
    const map: Record<CageStatus, string> = {
      [CageStatus.Empty]: '空笼',
      [CageStatus.Partial]: '部分占用',
      [CageStatus.Full]: '已满',
    };
    return map[status];
  }

  getStatusClass(status: CageStatus): string {
    const map: Record<CageStatus, string> = {
      [CageStatus.Empty]: 'status-empty',
      [CageStatus.Partial]: 'status-partial',
      [CageStatus.Full]: 'status-full',
    };
    return map[status];
  }

  openDialog(location?: CageLocation): void {
    const dialogRef = this.dialog.open(CageLocationDialogComponent, {
      width: '600px',
      data: location || null,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open(location ? '笼位更新成功' : '笼位创建成功', '关闭', { duration: 3000 });
        this.loadData();
      }
    });
  }

  deleteLocation(location: CageLocation): void {
    if (location.currentOccupancy > 0) {
      this.snackBar.open('该笼位仍有动物占用，无法删除', '关闭', { duration: 3000 });
      return;
    }
    if (confirm(`确认删除笼位 ${location.cageNumber}？此操作不可撤销。`)) {
      this.cageLocationService.delete(location.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('笼位删除成功', '关闭', { duration: 3000 });
            this.loadData();
          } else {
            this.snackBar.open(res.message || '删除笼位失败', '关闭', { duration: 3000 });
          }
        },
        error: () => this.snackBar.open('删除笼位失败', '关闭', { duration: 3000 }),
      });
    }
  }

  viewAllocationRecords(location: CageLocation): void {
    this.cageAllocationService.getByCage(location.id).subscribe({
      next: (res) => {
        const count = res.data?.length || 0;
        this.snackBar.open(`笼位 ${location.cageNumber} 共有 ${count} 条分配记录`, '关闭', { duration: 3000 });
      },
      error: () => this.snackBar.open('查询分配记录失败', '关闭', { duration: 3000 }),
    });
  }
}
