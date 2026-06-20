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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  AnimalBatchService,
  CageAllocationService,
  QuarantineService,
  DeathRecordService,
} from '../core/services';
import {
  AnimalBatch,
  BatchStatus,
  PagedQueryParams,
  PagedResult,
} from '../core/models';

@Component({
  selector: 'app-animal-batch-list',
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
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="page-container">
      <div class="search-bar">
        <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
          <mat-form-field appearance="outline" class="search-input">
            <mat-label>搜索</mat-label>
            <input matInput formControlName="searchKeyword" placeholder="批次号/订单号/课题组" />
            <button mat-icon-button matSuffix (click)="onSearch()" type="button">
              <mat-icon>search</mat-icon>
            </button>
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit">
            <mat-icon>refresh</mat-icon>
            刷新
          </button>
        </form>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="batchCode">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>批次号</th>
            <td mat-cell *matCellDef="let row">{{ row.batchCode }}</td>
          </ng-container>

          <ng-container matColumnDef="orderNumber">
            <th mat-header-cell *matHeaderCellDef>订单号</th>
            <td mat-cell *matCellDef="let row">{{ row.order?.orderNumber || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="researchGroup">
            <th mat-header-cell *matHeaderCellDef>课题组</th>
            <td mat-cell *matCellDef="let row">{{ row.researchGroup?.name || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="totalQuantity">
            <th mat-header-cell *matHeaderCellDef>动物数</th>
            <td mat-cell *matCellDef="let row">{{ row.totalQuantity }}</td>
          </ng-container>

          <ng-container matColumnDef="currentQuantity">
            <th mat-header-cell *matHeaderCellDef>当前数量</th>
            <td mat-cell *matCellDef="let row">
              <span [class.text-warn]="row.currentQuantity < row.totalQuantity">{{ row.currentQuantity }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="quarantineStatus">
            <th mat-header-cell *matHeaderCellDef>检疫状态</th>
            <td mat-cell *matCellDef="let row">
              <span [class]="getQuarantineBadgeClass(row.status)">{{ getQuarantineStatusText(row.status) }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>状态</th>
            <td mat-cell *matCellDef="let row">
              <mat-badge [hidden]="row.status === BatchStatus.Closed" class="status-badge-active">激活</mat-badge>
              <span [hidden]="row.status !== BatchStatus.Closed" class="status-badge-closed">关闭</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="arrivalDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>入房日期</th>
            <td mat-cell *matCellDef="let row">{{ row.arrivalDate | date: 'yyyy-MM-dd' }}</td>
          </ng-container>

          <ng-container matColumnDef="closedDate">
            <th mat-header-cell *matHeaderCellDef>关闭日期</th>
            <td mat-cell *matCellDef="let row">{{ row.closedDate ? (row.closedDate | date: 'yyyy-MM-dd') : '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button [matMenuTriggerFor]="actionMenu" aria-label="操作">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item (click)="openAllocationDialog(row)" [disabled]="row.status === BatchStatus.Closed">
                  <mat-icon>add_home</mat-icon>
                  <span>分配笼位</span>
                </button>
                <button mat-menu-item (click)="viewCageOccupancy(row)">
                  <mat-icon>visibility</mat-icon>
                  <span>查看笼位占用</span>
                </button>
                <button mat-menu-item (click)="startQuarantine(row)" [disabled]="row.status !== BatchStatus.Pending">
                  <mat-icon>health_and_safety</mat-icon>
                  <span>开始检疫</span>
                </button>
                <button mat-menu-item (click)="completeQuarantine(row)" [disabled]="row.status !== BatchStatus.Quarantining">
                  <mat-icon>check_circle</mat-icon>
                  <span>完成检疫</span>
                </button>
                <button mat-menu-item (click)="recordDeath(row)" [disabled]="row.status === BatchStatus.Closed">
                  <mat-icon>report</mat-icon>
                  <span>记录死亡</span>
                </button>
                <button mat-menu-item (click)="closeBatch(row)" [disabled]="!row.canClose || row.status === BatchStatus.Closed">
                  <mat-icon>lock</mat-icon>
                  <span>关闭批次</span>
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
    .search-bar { margin-bottom: 16px; display: flex; gap: 12px; align-items: flex-end; }
    .search-input { flex: 1; min-width: 300px; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .text-warn { color: #f44336; font-weight: 600; }
    .quarantine-badge-pending { background: #ffe0b2; color: #e65100; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .quarantine-badge-quarantining { background: #bbdefb; color: #1565c0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .quarantine-badge-active { background: #c8e6c9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .quarantine-badge-closed { background: #e0e0e0; color: #616161; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-badge-active { background: #4caf50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-badge-closed { background: #9e9e9e; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
  `]
})
export class AnimalBatchListComponent implements OnInit {
  private animalBatchService = inject(AnimalBatchService);
  private cageAllocationService = inject(CageAllocationService);
  private quarantineService = inject(QuarantineService);
  private deathRecordService = inject(DeathRecordService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly BatchStatus = BatchStatus;

  searchForm: FormGroup;
  dataSource = new MatTableDataSource<AnimalBatch>([]);
  displayedColumns: string[] = [
    'batchCode', 'orderNumber', 'researchGroup', 'totalQuantity',
    'currentQuantity', 'quarantineStatus', 'status', 'arrivalDate',
    'closedDate', 'actions'
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
    this.animalBatchService.getPaged(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dataSource.data = (res.data as PagedResult<AnimalBatch>).items;
          this.totalCount = (res.data as PagedResult<AnimalBatch>).totalCount;
        }
      },
      error: () => this.snackBar.open('加载批次数据失败', '关闭', { duration: 3000 }),
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

  getQuarantineStatusText(status: BatchStatus): string {
    const map: Record<BatchStatus, string> = {
      [BatchStatus.Pending]: '待检疫',
      [BatchStatus.Quarantining]: '检疫中',
      [BatchStatus.Active]: '已激活',
      [BatchStatus.Closed]: '已关闭',
    };
    return map[status];
  }

  getQuarantineBadgeClass(status: BatchStatus): string {
    const map: Record<BatchStatus, string> = {
      [BatchStatus.Pending]: 'quarantine-badge-pending',
      [BatchStatus.Quarantining]: 'quarantine-badge-quarantining',
      [BatchStatus.Active]: 'quarantine-badge-active',
      [BatchStatus.Closed]: 'quarantine-badge-closed',
    };
    return map[status];
  }

  openAllocationDialog(batch: AnimalBatch): void {
    this.snackBar.open('请打开笼位分配对话框', '了解', { duration: 2000 });
  }

  viewCageOccupancy(batch: AnimalBatch): void {
    this.cageAllocationService.getByBatch(batch.id).subscribe({
      next: (res) => {
        const count = res.data?.length || 0;
        this.snackBar.open(`批次 ${batch.batchCode} 共有 ${count} 条笼位分配记录`, '关闭', { duration: 3000 });
      },
      error: () => this.snackBar.open('查询笼位占用失败', '关闭', { duration: 3000 }),
    });
  }

  startQuarantine(batch: AnimalBatch): void {
    if (confirm(`确认对批次 ${batch.batchCode} 开始检疫？`)) {
      const dto = {
        batchId: batch.id,
        startDate: new Date(),
        quarantineDays: 14,
        observationItems: '常规观察：食欲、精神状态、粪便等',
      };
      this.quarantineService.start(dto as any).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('检疫开始成功', '关闭', { duration: 3000 });
            this.loadData();
          } else {
            this.snackBar.open(res.message || '开始检疫失败', '关闭', { duration: 3000 });
          }
        },
        error: () => this.snackBar.open('开始检疫失败', '关闭', { duration: 3000 }),
      });
    }
  }

  completeQuarantine(batch: AnimalBatch): void {
    const isPassed = confirm(`批次 ${batch.batchCode} 检疫是否通过？\n确定=通过，取消=不通过`);
    const resultNotes = prompt('请输入检疫结果备注：', isPassed ? '检疫通过，动物状态良好' : '检疫不通过');
    if (resultNotes === null) return;

    this.quarantineService.getByBatch(batch.id).subscribe({
      next: (res) => {
        const records = res.data || [];
        if (records.length === 0) {
          this.snackBar.open('未找到检疫记录', '关闭', { duration: 3000 });
          return;
        }
        const record = records[0];
        this.quarantineService.complete(record.id, {
          endDate: new Date(),
          results: resultNotes,
          isPassed,
        } as any).subscribe({
          next: (r) => {
            if (r.success) {
              this.snackBar.open(`检疫完成，结果：${isPassed ? '通过' : '不通过'}`, '关闭', { duration: 3000 });
              this.loadData();
            } else {
              this.snackBar.open(r.message || '完成检疫失败', '关闭', { duration: 3000 });
            }
          },
          error: () => this.snackBar.open('完成检疫失败', '关闭', { duration: 3000 }),
        });
      },
    });
  }

  recordDeath(batch: AnimalBatch): void {
    this.snackBar.open('请打开死亡记录对话框', '了解', { duration: 2000 });
  }

  closeBatch(batch: AnimalBatch): void {
    if (!batch.canClose) {
      this.snackBar.open('该批次存在未完成事项，无法关闭', '关闭', { duration: 3000 });
      return;
    }
    const reason = prompt(`请输入关闭批次 ${batch.batchCode} 的原因：`);
    if (!reason) return;

    if (confirm(`确认关闭批次 ${batch.batchCode}？此操作不可撤销。`)) {
      this.animalBatchService.close(batch.id, { closeReason: reason }).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('批次关闭成功', '关闭', { duration: 3000 });
            this.loadData();
          } else {
            this.snackBar.open(res.message || '关闭批次失败', '关闭', { duration: 3000 });
          }
        },
        error: () => this.snackBar.open('关闭批次失败', '关闭', { duration: 3000 }),
      });
    }
  }
}
