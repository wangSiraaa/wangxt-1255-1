import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CageAllocationService, AnimalBatchService, CageLocationService } from '../core/services';
import { CageAllocation, AnimalBatch, CageLocation } from '../core/models';
import { CageAllocationDialogComponent } from './cage-allocation-dialog.component';

@Component({
  selector: 'app-cage-allocation-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTabsModule,
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
              <input matInput formControlName="searchKeyword" placeholder="分配单号/批次号/笼位" />
              <button mat-icon-button matSuffix (click)="onSearch()" type="button">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
          </form>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="openAllocationDialog()">
            <mat-icon>add</mat-icon>
            新建分配
          </button>
        </div>
      </div>

      <div class="tabs-container">
        <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
          <mat-tab label="按批次查看">
            <div class="table-container">
              <table mat-table [dataSource]="batchDataSource">
                <ng-container matColumnDef="allocationId">
                  <th mat-header-cell *matHeaderCellDef>分配单号</th>
                  <td mat-cell *matCellDef="let row">{{ row.id.slice(-8).toUpperCase() }}</td>
                </ng-container>

                <ng-container matColumnDef="batchCode">
                  <th mat-header-cell *matHeaderCellDef>批次号</th>
                  <td mat-cell *matCellDef="let row">{{ row.batch?.batchCode || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="cageLocation">
                  <th mat-header-cell *matHeaderCellDef>笼位</th>
                  <td mat-cell *matCellDef="let row">{{ row.cageLocation?.cageNumber || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="allocatedCount">
                  <th mat-header-cell *matHeaderCellDef>分配数量</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="count-badge">{{ row.allocatedCount }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="allocationDate">
                  <th mat-header-cell *matHeaderCellDef>分配日期</th>
                  <td mat-cell *matCellDef="let row">{{ row.allocationDate | date: 'yyyy-MM-dd' }}</td>
                </ng-container>

                <ng-container matColumnDef="assignedBy">
                  <th mat-header-cell *matHeaderCellDef>分配人</th>
                  <td mat-cell *matCellDef="let row">{{ row.createdBy || '系统' }}</td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>状态</th>
                  <td mat-cell *matCellDef="let row">
                    <span [class]="row.isActive ? 'status-active' : 'status-released'">
                      {{ row.isActive ? '使用中' : '已释放' }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="releaseDate">
                  <th mat-header-cell *matHeaderCellDef>释放日期</th>
                  <td mat-cell *matCellDef="let row">{{ row.releaseDate ? (row.releaseDate | date: 'yyyy-MM-dd') : '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>操作</th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button [matMenuTriggerFor]="actionMenu" aria-label="操作"
                            [disabled]="!row.isActive">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #actionMenu="matMenu">
                      <button mat-menu-item (click)="releaseAllocation(row)">
                        <mat-icon>logout</mat-icon>
                        <span>释放笼位</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              <div class="empty-state" *ngIf="batchDataSource.data.length === 0">
                <mat-icon>inbox</mat-icon>
                <p>暂无按批次分配记录</p>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="按笼位查看">
            <div class="table-container">
              <table mat-table [dataSource]="cageDataSource">
                <ng-container matColumnDef="allocationId">
                  <th mat-header-cell *matHeaderCellDef>分配单号</th>
                  <td mat-cell *matCellDef="let row">{{ row.id.slice(-8).toUpperCase() }}</td>
                </ng-container>

                <ng-container matColumnDef="cageLocation">
                  <th mat-header-cell *matHeaderCellDef>笼位</th>
                  <td mat-cell *matCellDef="let row">{{ row.cageLocation?.cageNumber || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="batchCode">
                  <th mat-header-cell *matHeaderCellDef>批次号</th>
                  <td mat-cell *matCellDef="let row">{{ row.batch?.batchCode || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="allocatedCount">
                  <th mat-header-cell *matHeaderCellDef>分配数量</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="count-badge">{{ row.allocatedCount }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="allocationDate">
                  <th mat-header-cell *matHeaderCellDef>分配日期</th>
                  <td mat-cell *matCellDef="let row">{{ row.allocationDate | date: 'yyyy-MM-dd' }}</td>
                </ng-container>

                <ng-container matColumnDef="assignedBy">
                  <th mat-header-cell *matHeaderCellDef>分配人</th>
                  <td mat-cell *matCellDef="let row">{{ row.createdBy || '系统' }}</td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>状态</th>
                  <td mat-cell *matCellDef="let row">
                    <span [class]="row.isActive ? 'status-active' : 'status-released'">
                      {{ row.isActive ? '使用中' : '已释放' }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="releaseDate">
                  <th mat-header-cell *matHeaderCellDef>释放日期</th>
                  <td mat-cell *matCellDef="let row">{{ row.releaseDate ? (row.releaseDate | date: 'yyyy-MM-dd') : '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>操作</th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button [matMenuTriggerFor]="actionMenu2" aria-label="操作"
                            [disabled]="!row.isActive">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #actionMenu2="matMenu">
                      <button mat-menu-item (click)="releaseAllocation(row)">
                        <mat-icon>logout</mat-icon>
                        <span>释放笼位</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              <div class="empty-state" *ngIf="cageDataSource.data.length === 0">
                <mat-icon>inbox</mat-icon>
                <p>暂无按笼位分配记录</p>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .toolbar { margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .search-bar { flex: 1; }
    .search-input { min-width: 300px; max-width: 500px; }
    .actions { display: flex; gap: 8px; }
    .tabs-container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .table-container { padding: 16px; }
    .count-badge { background: #2196f3; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-active { background: #c8e6c9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .status-released { background: #e0e0e0; color: #616161; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .empty-state { padding: 48px; text-align: center; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
    .empty-state p { margin: 0; font-size: 14px; }
  `]
})
export class CageAllocationListComponent implements OnInit {
  private cageAllocationService = inject(CageAllocationService);
  private animalBatchService = inject(AnimalBatchService);
  private cageLocationService = inject(CageLocationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  searchForm: FormGroup;
  batchDataSource = new MatTableDataSource<CageAllocation>([]);
  cageDataSource = new MatTableDataSource<CageAllocation>([]);
  displayedColumns: string[] = [
    'allocationId', 'batchCode', 'cageLocation', 'allocatedCount',
    'allocationDate', 'assignedBy', 'status', 'releaseDate', 'actions'
  ];

  activeBatches: AnimalBatch[] = [];
  availableCages: CageLocation[] = [];
  currentTabIndex = 0;

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
    this.cageLocationService.getAvailable(1).subscribe({
      next: (res) => this.availableCages = res.data || [],
    });
  }

  loadData(): void {
    if (this.currentTabIndex === 0) {
      this.loadByBatch();
    } else {
      this.loadByCage();
    }
  }

  loadByBatch(): void {
    const keyword = this.searchForm.get('searchKeyword')?.value || '';
    this.animalBatchService.getActive().subscribe({
      next: (batchesRes) => {
        const batches = batchesRes.data || [];
        const filtered = keyword
          ? batches.filter(b => b.batchCode.toLowerCase().includes(keyword.toLowerCase()))
          : batches;
        this.loadAllocationsForBatches(filtered.map(b => b.id));
      },
      error: () => this.snackBar.open('加载批次失败', '关闭', { duration: 3000 }),
    });
  }

  loadAllocationsForBatches(batchIds: string[]): void {
    const all: CageAllocation[] = [];
    if (batchIds.length === 0) {
      this.batchDataSource.data = [];
      return;
    }
    let completed = 0;
    batchIds.forEach(batchId => {
      this.cageAllocationService.getByBatch(batchId).subscribe({
        next: (res) => {
          all.push(...(res.data || []));
          completed++;
          if (completed === batchIds.length) {
            all.sort((a, b) => new Date(b.allocationDate).getTime() - new Date(a.allocationDate).getTime());
            this.batchDataSource.data = all;
          }
        },
        error: () => completed++,
      });
    });
  }

  loadByCage(): void {
    const keyword = this.searchForm.get('searchKeyword')?.value || '';
    this.cageLocationService.getAvailable(0).subscribe({
      next: (cagesRes) => {
        const cages = cagesRes.data || [];
        const filtered = keyword
          ? cages.filter(c => c.cageNumber.toLowerCase().includes(keyword.toLowerCase()))
          : cages;
        this.loadAllocationsForCages(filtered.map(c => c.id));
      },
      error: () => this.snackBar.open('加载笼位失败', '关闭', { duration: 3000 }),
    });
  }

  loadAllocationsForCages(cageIds: string[]): void {
    const all: CageAllocation[] = [];
    if (cageIds.length === 0) {
      this.cageDataSource.data = [];
      return;
    }
    let completed = 0;
    cageIds.forEach(cageId => {
      this.cageAllocationService.getByCage(cageId).subscribe({
        next: (res) => {
          all.push(...(res.data || []));
          completed++;
          if (completed === cageIds.length) {
            all.sort((a, b) => new Date(b.allocationDate).getTime() - new Date(a.allocationDate).getTime());
            this.cageDataSource.data = all;
          }
        },
        error: () => completed++,
      });
    });
  }

  onSearch(): void {
    this.loadData();
  }

  onTabChange(index: number): void {
    this.currentTabIndex = index;
    this.loadData();
  }

  openAllocationDialog(): void {
    const dialogRef = this.dialog.open(CageAllocationDialogComponent, {
      width: '600px',
      data: {
        batches: this.activeBatches,
        cages: this.availableCages,
      },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('笼位分配成功', '关闭', { duration: 3000 });
        this.loadData();
        this.loadReferences();
      }
    });
  }

  releaseAllocation(allocation: CageAllocation): void {
    const reason = prompt(`请输入释放原因（可选）：`, '动物转出/批次关闭');
    if (reason === null) return;
    const defaultReleaseCount = allocation.allocatedCount - (allocation.releasedCount || 0);
    const releaseCountStr = prompt(`请输入释放数量（本次最多 ${defaultReleaseCount}）：`, String(defaultReleaseCount));
    if (releaseCountStr === null) return;
    const releaseCount = Number(releaseCountStr);
    if (releaseCount <= 0 || releaseCount > defaultReleaseCount) {
      this.snackBar.open('释放数量不合法', '关闭', { duration: 3000 });
      return;
    }
    if (confirm(`确认释放 ${releaseCount} 只动物的笼位？`)) {
      this.cageAllocationService.release(allocation.id, {
        releaseCount,
        releaseReason: reason || '',
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('笼位释放成功', '关闭', { duration: 3000 });
            this.loadData();
            this.loadReferences();
          } else {
            this.snackBar.open(res.message || '释放失败', '关闭', { duration: 3000 });
          }
        },
        error: () => this.snackBar.open('释放失败，请重试', '关闭', { duration: 3000 }),
      });
    }
  }
}
