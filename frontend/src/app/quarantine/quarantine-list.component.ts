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
import { QuarantineService, AnimalBatchService, CageAllocationService } from '../core/services';
import { QuarantineRecord, PagedQueryParams, PagedResult, AnimalBatch, CageAllocation } from '../core/models';
import { QuarantineDialogComponent } from './quarantine-dialog.component';

@Component({
  selector: 'app-quarantine-list',
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
              <input matInput formControlName="searchKeyword" placeholder="检疫号/批次号/兽医" />
              <button mat-icon-button matSuffix (click)="onSearch()" type="button">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
          </form>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="openStartDialog()">
            <mat-icon>add</mat-icon>
            开始检疫
          </button>
        </div>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="quarantineNumber">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>检疫号</th>
            <td mat-cell *matCellDef="let row">{{ 'Q' + row.id.slice(-6).toUpperCase() }}</td>
          </ng-container>

          <ng-container matColumnDef="batchCode">
            <th mat-header-cell *matHeaderCellDef>批次号</th>
            <td mat-cell *matCellDef="let row">{{ row.batch?.batchCode || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="cageLocation">
            <th mat-header-cell *matHeaderCellDef>笼位</th>
            <td mat-cell *matCellDef="let row">{{ getCageLocation(row.batchId) || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="veterinarian">
            <th mat-header-cell *matHeaderCellDef>兽医</th>
            <td mat-cell *matCellDef="let row">{{ (row as any).veterinarian || row.completedBy || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="startDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>开始日期</th>
            <td mat-cell *matCellDef="let row">{{ row.startDate | date: 'yyyy-MM-dd' }}</td>
          </ng-container>

          <ng-container matColumnDef="endDate">
            <th mat-header-cell *matHeaderCellDef>结束日期</th>
            <td mat-cell *matCellDef="let row">{{ row.endDate ? (row.endDate | date: 'yyyy-MM-dd') : '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="isPassed">
            <th mat-header-cell *matHeaderCellDef>是否通过</th>
            <td mat-cell *matCellDef="let row">
              <span *ngIf="row.isPassed === true" class="badge-passed">通过</span>
              <span *ngIf="row.isPassed === false" class="badge-failed">不通过</span>
              <span *ngIf="row.isPassed === undefined || row.isPassed === null" class="badge-pending">待判定</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="resultNotes">
            <th mat-header-cell *matHeaderCellDef>结果备注</th>
            <td mat-cell *matCellDef="let row" [matTooltip]="row.results || row.remarks || ''">
              {{ truncate(row.results || row.remarks || '-', 20) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button [matMenuTriggerFor="actionMenu" aria-label="操作">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item (click)="openStartDialog(row.batchId)" [disabled]="!!row.endDate">
                  <mat-icon>play_arrow</mat-icon>
                  <span>开始检疫</span>
                </button>
                <button mat-menu-item (click)="openCompleteDialog(row)" [disabled]="!!row.endDate">
                  <mat-icon>check_circle</mat-icon>
                  <span>完成检疫</span>
                </button>
                <button mat-menu-item (click)="viewDetail(row)">
                  <mat-icon>visibility</mat-icon>
                  <span>查看详情</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div class="empty-state" *ngIf="dataSource.data.length === 0">
          <mat-icon>inbox</mat-icon>
          <p>暂无检疫记录</p>
        </div>

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
    .badge-passed { background: #c8e6c9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-failed { background: #ffcdd2; color: #c62828; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-pending { background: #fff9c4; color: #f57f17; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .empty-state { padding: 48px; text-align: center; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
    .empty-state p { margin: 0; font-size: 14px; }
  `]
})
export class QuarantineListComponent implements OnInit {
  private quarantineService = inject(QuarantineService);
  private animalBatchService = inject(AnimalBatchService);
  private cageAllocationService = inject(CageAllocationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchForm: FormGroup;
  dataSource = new MatTableDataSource<QuarantineRecord>([]);
  displayedColumns: string[] = [
    'quarantineNumber', 'batchCode', 'cageLocation', 'veterinarian',
    'startDate', 'endDate', 'isPassed', 'resultNotes', 'actions'
  ];

  pageIndex = 0;
  pageSize = 25;
  totalCount = 0;
  sortField = 'createdAt';
  sortDirection = 'desc';

  activeBatches: AnimalBatch[] = [];
  cageAllocationMap = new Map<string, string>();

  constructor() {
    this.searchForm = this.fb.group({
      searchKeyword: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadReferences();
  }

  loadReferences(): void {
    this.animalBatchService.getActive().subscribe({
      next: (res) => {
        this.activeBatches = res.data || [];
        this.loadCageAllocations();
      },
    });
  }

  loadCageAllocations(): void {
    this.activeBatches.forEach(batch => {
      this.cageAllocationService.getByBatch(batch.id).subscribe({
        next: (res) => {
          const allocs = res.data || [];
          const active = allocs.filter(a => a.isActive);
          if (active.length > 0) {
            const cageNames = active.map(a => a.cageLocation?.cageNumber).join(', ');
            this.cageAllocationMap.set(batch.id, cageNames);
          }
        },
      });
    });
  }

  getCageLocation(batchId: string): string {
    return this.cageAllocationMap.get(batchId) || '';
  }

  truncate(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  loadData(): void {
    const params: PagedQueryParams = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortDirection: this.sortDirection,
      searchKeyword: this.searchForm.get('searchKeyword')?.value || '',
    };
    this.quarantineService.getPaged(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dataSource.data = (res.data as PagedResult<QuarantineRecord>).items;
          this.totalCount = (res.data as PagedResult<QuarantineRecord>).totalCount;
        }
      },
      error: () => this.snackBar.open('加载检疫数据失败', '关闭', { duration: 3000 }),
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

  openStartDialog(batchId?: string): void {
    const dialogRef = this.dialog.open(QuarantineDialogComponent, {
      width: '600px',
      data: {
        mode: 'start',
        batchId,
        batches: this.activeBatches,
      },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('检疫开始成功', '关闭', { duration: 3000 });
        this.loadData();
      }
    });
  }

  openCompleteDialog(record: QuarantineRecord): void {
    const dialogRef = this.dialog.open(QuarantineDialogComponent, {
      width: '600px',
      data: {
        mode: 'complete',
        record,
      },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('检疫完成', '关闭', { duration: 3000 });
        this.loadData();
      }
    });
  }

  viewDetail(record: QuarantineRecord): void {
    const detail = `
检疫号: Q${record.id.slice(-6).toUpperCase()}
批次: ${record.batch?.batchCode || '-'}
开始日期: ${new Date(record.startDate).toLocaleDateString('zh-CN')}
结束日期: ${record.endDate ? new Date(record.endDate).toLocaleDateString('zh-CN') : '-'}
观察项: ${record.observationItems || '-'}
结果: ${record.results || '-'}
是否通过: ${record.isPassed === true ? '通过' : record.isPassed === false ? '不通过' : '待判定'}
备注: ${record.remarks || '-'}
    `.trim();
    alert(detail);
  }
}
