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
import { MatChipsModule } from '@angular/material/chips';
import { DeathRecordService, AnimalBatchService, DeathInvestigationService } from '../core/services';
import { DeathRecord, DeathType, PagedQueryParams, PagedResult, AnimalBatch, DeathInvestigation, InvestigationStatus } from '../core/models';
import { DeathRecordDialogComponent } from './death-record-dialog.component';

@Component({
  selector: 'app-death-record-list',
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
    MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <div class="toolbar">
        <div class="search-bar">
          <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
            <mat-form-field appearance="outline" class="search-input">
              <mat-label>搜索</mat-label>
              <input matInput formControlName="searchKeyword" placeholder="死亡号/耳标/批次/兽医" />
              <button mat-icon-button matSuffix (click)="onSearch()" type="button">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
          </form>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon>
            新增死亡
          </button>
        </div>
      </div>

      <div class="stats-bar" *ngIf="stats">
        <div class="stat-card normal">
          <div class="stat-number">{{ stats.normal }}</div>
          <div class="stat-label">正常死亡</div>
        </div>
        <div class="stat-card abnormal">
          <div class="stat-number">{{ stats.abnormal }}</div>
          <div class="stat-label">异常死亡</div>
        </div>
        <div class="stat-card investigating">
          <div class="stat-number">{{ stats.investigating }}</div>
          <div class="stat-label">调查中</div>
        </div>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="deathNumber">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>死亡号</th>
            <td mat-cell *matCellDef="let row">{{ 'D' + row.id.slice(-6).toUpperCase() }}</td>
          </ng-container>

          <ng-container matColumnDef="animalInfo">
            <th mat-header-cell *matHeaderCellDef>动物</th>
            <td mat-cell *matCellDef="let row">
              <div>{{ row.animal?.tagNumber || row.animal?.animalNumber || '未标记' }}</div>
              <div class="sub-text" *ngIf="row.animal">
                {{ row.animal?.gender !== undefined ? (row.animal.gender === 0 ? '♂' : row.animal.gender === 1 ? '♀' : '?') : '' }}
                {{ row.animal?.species || row.batch?.species || '' }}
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="batch">
            <th mat-header-cell *matHeaderCellDef>批次</th>
            <td mat-cell *matCellDef="let row">
              <span class="batch-chip">{{ row.batch?.batchCode || '-' }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="deathDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>死亡日期</th>
            <td mat-cell *matCellDef="let row">{{ row.deathDate | date: 'yyyy-MM-dd' }}</td>
          </ng-container>

          <ng-container matColumnDef="deathTime">
            <th mat-header-cell *matHeaderCellDef>死亡时间</th>
            <td mat-cell *matCellDef="let row">{{ (row as any).deathTime || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="deathType">
            <th mat-header-cell *matHeaderCellDef>死亡类型</th>
            <td mat-cell *matCellDef="let row">
              <span [class]="getDeathTypeBadgeClass(row.deathType)">
                <mat-icon class="badge-icon">{{ getDeathTypeIcon(row.deathType) }}</mat-icon>
                {{ getDeathTypeText(row.deathType) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="hasInvestigation">
            <th mat-header-cell *matHeaderCellDef>是否有调查</th>
            <td mat-cell *matCellDef="let row">
              <mat-badge *ngIf="row.isInvestigated" [matBadge]="'已启动'" class="badge-has">
                <mat-icon color="primary">description</mat-icon>
              </mat-badge>
              <span *ngIf="!row.isInvestigated" class="badge-none">
                <mat-icon>description</mat-icon>
                无
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="investigationStatus">
            <th mat-header-cell *matHeaderCellDef>调查状态</th>
            <td mat-cell *matCellDef="let row">
              <ng-container *ngIf="row.isInvestigated; else noInvest">
                <span [class]="getInvestigationStatusClass(row.investigationId || '')">
                  {{ getInvestigationStatusText(row.investigationId || '') }}
                </span>
              </ng-container>
              <ng-template #noInvest>
                <span class="status-none">-</span>
              </ng-template>
            </td>
          </ng-container>

          <ng-container matColumnDef="veterinarian">
            <th mat-header-cell *matHeaderCellDef>处理兽医</th>
            <td mat-cell *matCellDef="let row">{{ (row as any).veterinarian || row.reportedBy || '-' }}</td>
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
                  <span>查看/编辑</span>
                </button>
                <button mat-menu-item (click)="createInvestigation(row)"
                        [disabled]="row.deathType !== DeathType.Abnormal && row.deathType !== DeathType.Unknown">
                  <mat-icon>assignment_late</mat-icon>
                  <span>创建调查</span>
                </button>
                <button mat-menu-item (click)="deleteRecord(row)" class="danger-item">
                  <mat-icon>delete</mat-icon>
                  <span>删除</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              [class.row-abnormal]="row.deathType === DeathType.Abnormal"></tr>
        </table>

        <div class="empty-state" *ngIf="dataSource.data.length === 0">
          <mat-icon>inbox</mat-icon>
          <p>暂无死亡记录</p>
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
    .stats-bar { display: flex; gap: 16px; margin-bottom: 16px; }
    .stat-card {
      flex: 1;
      padding: 16px 20px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-card.normal { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); }
    .stat-card.abnormal { background: linear-gradient(135deg, #ffebee, #ffcdd2); }
    .stat-card.investigating { background: linear-gradient(135deg, #fff3e0, #ffe0b2); }
    .stat-number { font-size: 28px; font-weight: 700; color: #333; }
    .stat-label { font-size: 13px; color: #666; margin-top: 4px; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .sub-text { font-size: 11px; color: #999; margin-top: 2px; }
    .batch-chip { background: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 10px; font-size: 12px; font-weight: 500; }
    .badge-normal { background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
    .badge-abnormal { background: #ffebee; color: #c62828; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; font-weight: 500; }
    .badge-euthanasia { background: #f3e5f5; color: #6a1b9a; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
    .badge-unknown { background: #f5f5f5; color: #616161; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
    .badge-icon { font-size: 14px; width: 14px; height: 14px; }
    .badge-has { color: #1976d2; }
    .badge-none { color: #9e9e9e; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
    .status-inprogress { background: #fff3e0; color: #e65100; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .status-completed { background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .status-closed { background: #e0e0e0; color: #616161; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-none { color: #bdbdbd; font-size: 12px; }
    .row-abnormal { background: #fff8f8; }
    .danger-item { color: #f44336 !important; }
    .empty-state { padding: 48px; text-align: center; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
    .empty-state p { margin: 0; font-size: 14px; }
  `]
})
export class DeathRecordListComponent implements OnInit {
  private deathRecordService = inject(DeathRecordService);
  private animalBatchService = inject(AnimalBatchService);
  private deathInvestigationService = inject(DeathInvestigationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly DeathType = DeathType;

  searchForm: FormGroup;
  dataSource = new MatTableDataSource<DeathRecord>([]);
  displayedColumns: string[] = [
    'deathNumber', 'animalInfo', 'batch', 'deathDate', 'deathTime',
    'deathType', 'hasInvestigation', 'investigationStatus', 'veterinarian', 'actions'
  ];

  pageIndex = 0;
  pageSize = 25;
  totalCount = 0;
  sortField = 'createdAt';
  sortDirection = 'desc';

  activeBatches: AnimalBatch[] = [];
  investigationMap = new Map<string, DeathInvestigation>();
  stats = { normal: 0, abnormal: 0, investigating: 0 };

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
      next: (res) => this.activeBatches = res.data || [],
    });
  }

  calculateStats(): void {
    this.stats = { normal: 0, abnormal: 0, investigating: 0 };
    this.dataSource.data.forEach(r => {
      if (r.deathType === DeathType.Normal || r.deathType === DeathType.Euthanasia) this.stats.normal++;
      if (r.deathType === DeathType.Abnormal || r.deathType === DeathType.Unknown) this.stats.abnormal++;
      if (r.isInvestigated) {
        const inv = this.investigationMap.get(r.investigationId || '');
        if (inv && (inv.status === InvestigationStatus.InProgress || inv.status === InvestigationStatus.Pending)) {
          this.stats.investigating++;
        }
      }
    });
  }

  loadData(): void {
    const params: PagedQueryParams = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortDirection: this.sortDirection,
      searchKeyword: this.searchForm.get('searchKeyword')?.value || '',
    };
    this.deathRecordService.getPaged(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dataSource.data = (res.data as PagedResult<DeathRecord>).items;
          this.totalCount = (res.data as PagedResult<DeathRecord>).totalCount;
          this.loadInvestigations();
        }
      },
      error: () => this.snackBar.open('加载死亡记录失败', '关闭', { duration: 3000 }),
    });
  }

  loadInvestigations(): void {
    const ids = this.dataSource.data.filter(d => d.isInvestigated && d.investigationId).map(d => d.investigationId!);
    if (ids.length === 0) {
      this.calculateStats();
      return;
    }
    let loaded = 0;
    ids.forEach(id => {
      this.deathInvestigationService.getById(id).subscribe({
        next: (res) => {
          if (res.success && res.data) this.investigationMap.set(id, res.data as DeathInvestigation);
          loaded++;
          if (loaded === ids.length) this.calculateStats();
        },
        error: () => { loaded++; if (loaded === ids.length) this.calculateStats(); },
      });
    });
  }

  getDeathTypeText(type: DeathType): string {
    const map: Record<DeathType, string> = {
      [DeathType.Normal]: '正常死亡',
      [DeathType.Abnormal]: '异常死亡',
      [DeathType.Euthanasia]: '安乐死',
      [DeathType.Unknown]: '未知',
    };
    return map[type];
  }

  getDeathTypeBadgeClass(type: DeathType): string {
    const map: Record<DeathType, string> = {
      [DeathType.Normal]: 'badge-normal',
      [DeathType.Abnormal]: 'badge-abnormal',
      [DeathType.Euthanasia]: 'badge-euthanasia',
      [DeathType.Unknown]: 'badge-unknown',
    };
    return map[type];
  }

  getDeathTypeIcon(type: DeathType): string {
    const map: Record<DeathType, string> = {
      [DeathType.Normal]: 'favorite',
      [DeathType.Abnormal]: 'warning',
      [DeathType.Euthanasia]: 'self_improvement',
      [DeathType.Unknown]: 'help_outline',
    };
    return map[type];
  }

  getInvestigationStatusText(invId: string): string {
    const inv = this.investigationMap.get(invId);
    if (!inv) return '待加载';
    const map: Record<InvestigationStatus, string> = {
      [InvestigationStatus.Pending]: '待开始',
      [InvestigationStatus.InProgress]: '进行中',
      [InvestigationStatus.Completed]: '已完成',
      [InvestigationStatus.Closed]: '已关闭',
    };
    return map[inv.status];
  }

  getInvestigationStatusClass(invId: string): string {
    const inv = this.investigationMap.get(invId);
    if (!inv) return 'status-none';
    const map: Record<InvestigationStatus, string> = {
      [InvestigationStatus.Pending]: 'status-inprogress',
      [InvestigationStatus.InProgress]: 'status-inprogress',
      [InvestigationStatus.Completed]: 'status-completed',
      [InvestigationStatus.Closed]: 'status-closed',
    };
    return map[inv.status];
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

  openDialog(record?: DeathRecord): void {
    const dialogRef = this.dialog.open(DeathRecordDialogComponent, {
      width: '650px',
      data: record
        ? { mode: 'edit', record, batches: this.activeBatches }
        : { mode: 'create', batches: this.activeBatches },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open(record ? '记录更新成功' : '死亡记录创建成功', '关闭', { duration: 3000 });
        this.loadData();
      }
    });
  }

  createInvestigation(record: DeathRecord): void {
    if (record.isInvestigated) {
      this.snackBar.open('该死亡记录已存在调查', '关闭', { duration: 3000 });
      return;
    }
    if (!confirm(`确认对该死亡记录启动调查？\n死亡号: D${record.id.slice(-6).toUpperCase()}`)) return;
    this.deathInvestigationService.create({
      batchId: record.batchId,
      deathRecordId: record.id,
      investigationNumber: 'INV-' + Date.now().toString().slice(-8),
      startDate: new Date(),
      investigator: record.reportedBy || '当前用户',
      initialFindings: `死亡类型: ${this.getDeathTypeText(record.deathType)}${record.causeOfDeath ? '; 初步原因: ' + record.causeOfDeath : ''}`,
    } as any).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('调查已启动', '关闭', { duration: 3000 });
          this.loadData();
        } else {
          this.snackBar.open(res.message || '启动调查失败', '关闭', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('启动调查失败', '关闭', { duration: 3000 }),
    });
  }

  deleteRecord(record: DeathRecord): void {
    if (!confirm(`确认删除死亡记录 D${record.id.slice(-6).toUpperCase()}？\n此操作不可撤销。`)) return;
    if (record.isInvestigated) {
      if (!confirm('该记录关联调查，删除后调查信息也将受影响，确认继续？')) return;
    }
    this.deathRecordService.delete(record.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('记录删除成功', '关闭', { duration: 3000 });
          this.loadData();
        } else {
          this.snackBar.open(res.message || '删除失败', '关闭', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('删除失败', '关闭', { duration: 3000 }),
    });
  }
}
