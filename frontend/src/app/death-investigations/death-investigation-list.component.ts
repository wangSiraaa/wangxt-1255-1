import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { Inject, NgModule } from '@angular/core';
import { DeathInvestigationService, DeathRecordService, AnimalBatchService } from '../core/services';
import { DeathInvestigation, InvestigationStatus, PagedQueryParams, PagedResult, AnimalBatch, DeathRecord, RootCauseCategory } from '../core/models';

@Component({
  selector: 'app-investigation-complete-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'zh-CN' }],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="primary">task_alt</mat-icon>
      完成调查 - {{ data.investigation?.investigationNumber }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>根因分类 *</mat-label>
            <mat-select formControlName="rootCauseCategory">
              <mat-option *ngFor="let opt of rootCauseOptions" [value]="opt.value">
                {{ opt.label }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('rootCauseCategory')?.hasError('required')">
              请选择根因分类
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>完成日期 *</mat-label>
            <input matInput [matDatepicker]="dp" formControlName="completeDate" />
            <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
            <mat-datepicker #dp></mat-datepicker>
            <mat-error *ngIf="form.get('completeDate')?.hasError('required')">
              请选择日期
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>根本原因描述 *</mat-label>
            <textarea matInput formControlName="rootCauseDescription" rows="3" maxlength="500"
                      placeholder="详细描述经过验证的根本原因"></textarea>
            <mat-error *ngIf="form.get('rootCauseDescription')?.hasError('required')">
              请填写根因描述
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>纠正/预防措施 *</mat-label>
            <textarea matInput formControlName="correctiveActions" rows="3" maxlength="1000"
                      placeholder="如：加强操作培训、改进笼具设计、调整饲养密度等"></textarea>
            <mat-error *ngIf="form.get('correctiveActions')?.hasError('required')">
              请填写纠正措施
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>措施负责人</mat-label>
            <input matInput formControlName="actionOwner" maxlength="50" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>措施完成日期</mat-label>
            <input matInput [matDatepicker]="dp2" formControlName="actionDeadline" />
            <mat-datepicker-toggle matIconSuffix [for]="dp2"></mat-datepicker-toggle>
            <mat-datepicker #dp2></mat-datepicker>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">取消</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!form.valid || isSubmitting">
        <mat-icon *ngIf="!isSubmitting">check_circle</mat-icon>
        <mat-icon *ngIf="isSubmitting" class="spinner">sync</mat-icon>
        {{ isSubmitting ? '提交中...' : '确认完成' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { padding-top: 12px; min-width: 600px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 4px; }
    .form-row > * { flex: 1; }
    .full-width { flex: 1; }
    h2 { display: flex; align-items: center; gap: 8px; }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
class InvestigationCompleteDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InvestigationCompleteDialogComponent>);
  private service = inject(DeathInvestigationService);
  private snackBar = inject(MatSnackBar);
  readonly data = inject(MAT_DIALOG_DATA);

  readonly rootCauseOptions = [
    { value: 'environment', label: '环境因素（温湿度、通风、噪声）' },
    { value: 'husbandry', label: '饲养管理（喂食、供水、密度）' },
    { value: 'infection', label: '感染性疾病（细菌/病毒/寄生虫）' },
    { value: 'procedure', label: '操作/实验相关（麻醉、手术、给药）' },
    { value: 'transport', label: '运输/搬运应激' },
    { value: 'genetic', label: '遗传/品系相关' },
    { value: 'unknown', label: '未确定' },
    { value: 'other', label: '其他' },
  ];

  form: FormGroup;
  isSubmitting = false;

  constructor() {
    this.form = this.fb.group({
      rootCauseCategory: ['', Validators.required],
      rootCauseDescription: ['', Validators.required],
      correctiveActions: ['', Validators.required],
      completeDate: [new Date(), Validators.required],
      actionOwner: [''],
      actionDeadline: [''],
    });
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    this.isSubmitting = true;
    const fv = this.form.getRawValue();
    this.service.complete(this.data.investigation.id, {
      rootCauseCategory: fv.rootCauseCategory,
      rootCauseDescription: fv.rootCauseDescription,
      correctiveActions: fv.correctiveActions,
      completeDate: fv.completeDate,
      findings: (this.data.investigation as any).findings,
    } as any).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.snackBar.open('调查已完成', '关闭', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || '操作失败', '关闭', { duration: 3000 });
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.snackBar.open('操作失败', '关闭', { duration: 3000 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

@Component({
  selector: 'app-investigation-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>assignment_late</mat-icon>
      创建调查
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>关联死亡记录</mat-label>
            <mat-select formControlName="deathRecordId">
              <mat-option value="">-- 手动新建 --</mat-option>
              <mat-option *ngFor="let r of data.uninvestigated || []" [value]="r.id">
                D{{ r.id.slice(-6).toUpperCase() }} - {{ r.batch?.batchCode || '' }}
                {{ r.deathDate | date:'MM-dd' }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>批次 *</mat-label>
            <mat-select formControlName="batchId">
              <mat-option *ngFor="let b of data.batches || []" [value]="b.id">
                {{ b.batchCode }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('batchId')?.hasError('required')">必填</mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>调查员 *</mat-label>
            <input matInput formControlName="investigator" maxlength="50" />
            <mat-error *ngIf="form.get('investigator')?.hasError('required')">必填</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>开始日期 *</mat-label>
            <input matInput [matDatepicker]="dp" formControlName="startDate" />
            <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
            <mat-datepicker #dp></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>初步发现</mat-label>
            <textarea matInput formControlName="initialFindings" rows="3" maxlength="500"
                      placeholder="现场情况、动物症状、初步假设"></textarea>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">取消</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!form.valid || isSubmitting">
        <mat-icon *ngIf="!isSubmitting">start</mat-icon>
        <mat-icon *ngIf="isSubmitting" class="spinner">sync</mat-icon>
        {{ isSubmitting ? '创建中...' : '创建并启动' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { padding-top: 12px; min-width: 600px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 4px; }
    .form-row > * { flex: 1; }
    .full-width { flex: 1; }
    h2 { display: flex; align-items: center; gap: 8px; }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
class InvestigationCreateDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InvestigationCreateDialogComponent>);
  private service = inject(DeathInvestigationService);
  private snackBar = inject(MatSnackBar);
  readonly data = inject(MAT_DIALOG_DATA);

  form: FormGroup;
  isSubmitting = false;

  constructor() {
    this.form = this.fb.group({
      deathRecordId: [''],
      batchId: ['', Validators.required],
      investigator: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      initialFindings: [''],
    });
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    this.isSubmitting = true;
    const fv = this.form.getRawValue();
    this.service.create({
      batchId: fv.batchId,
      deathRecordId: fv.deathRecordId || undefined,
      investigationNumber: 'INV-' + Date.now().toString().slice(-8),
      startDate: fv.startDate,
      investigator: fv.investigator,
      initialFindings: fv.initialFindings,
    } as any).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.snackBar.open('调查创建成功', '关闭', { duration: 3000 });
          this.dialogRef.close(res.data);
        } else {
          this.snackBar.open(res.message || '创建失败', '关闭', { duration: 3000 });
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.snackBar.open('创建失败', '关闭', { duration: 3000 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

@Component({
  selector: 'app-investigation-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="primary">description</mat-icon>
      调查详情 - {{ data.investigation.investigationNumber }}
    </h2>
    <mat-dialog-content class="detail-content">
      <mat-tab-group>
        <mat-tab label="基本信息">
          <div class="detail-grid">
            <div class="detail-item">
              <label>调查状态</label>
              <span [class]="getStatusClass(data.investigation.status)">
                {{ getStatusText(data.investigation.status) }}
              </span>
            </div>
            <div class="detail-item">
              <label>调查员</label>
              <span>{{ (data.investigation as any).investigator || (data.investigation as any).investigatorName || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>批次</label>
              <span>{{ data.batch?.batchCode || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>关联死亡记录</label>
              <span>{{ data.deathRecord ? ('D' + data.deathRecord.id.slice(-6).toUpperCase()) : '-' }}</span>
            </div>
            <div class="detail-item">
              <label>开始日期</label>
              <span>{{ data.investigation.startDate | date: 'yyyy-MM-dd' }}</span>
            </div>
            <div class="detail-item">
              <label>完成日期</label>
              <span>{{ (data.investigation as any).endDate || (data.investigation as any).completeDate ? ((data.investigation as any).endDate || (data.investigation as any).completeDate | date:'yyyy-MM-dd') : '-' }}</span>
            </div>
            <div class="detail-item" *ngIf="(data.investigation as any).rootCauseCategory">
              <label>根因分类</label>
              <span>{{ getCategoryText((data.investigation as any).rootCauseCategory) }}</span>
            </div>
            <div class="detail-item" *ngIf="(data.investigation as any).rootCauseDescription">
              <label>根本原因</label>
              <span class="multiline">{{ (data.investigation as any).rootCauseDescription }}</span>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="调查过程">
          <div class="detail-section">
            <h5>初步发现</h5>
            <p class="multiline">{{ (data.investigation as any).initialFindings || '（未填写）' }}</p>
            <h5>调查发现</h5>
            <p class="multiline">{{ (data.investigation as any).findings || '（未填写）' }}</p>
            <h5>纠正/预防措施</h5>
            <p class="multiline">{{ (data.investigation as any).correctiveActions || '（未填写）' }}</p>
            <h5 *ngIf="(data.investigation as any).actionOwner">措施负责人</h5>
            <p *ngIf="(data.investigation as any).actionOwner">{{ (data.investigation as any).actionOwner }}</p>
            <h5 *ngIf="(data.investigation as any).conclusion">结论</h5>
            <p *ngIf="(data.investigation as any).conclusion" class="multiline">{{ (data.investigation as any).conclusion }}</p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
        关闭
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; gap: 8px; }
    .detail-content { min-width: 700px; max-height: 560px; overflow-y: auto; }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 8px 0;
    }
    .detail-item label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .detail-item span {
      font-size: 14px;
      color: #222;
    }
    .multiline {
      white-space: pre-wrap;
      line-height: 1.6;
      display: block;
      padding: 8px 0;
    }
    .detail-section h5 {
      color: #1976d2;
      margin: 16px 0 6px;
      font-size: 13px;
      font-weight: 600;
    }
    .detail-section p {
      background: #fafafa;
      padding: 12px;
      border-radius: 4px;
      margin: 0 0 8px;
      color: #444;
      font-size: 14px;
    }
    .status-pending { background: #e3f2fd; color: #1565c0; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .status-inprogress { background: #fff3e0; color: #e65100; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .status-completed { background: #e8f5e9; color: #2e7d32; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .status-closed { background: #e0e0e0; color: #616161; padding: 4px 10px; border-radius: 4px; font-size: 12px; }
  `]
})
class InvestigationDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<InvestigationDetailDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA);

  getStatusText(s: InvestigationStatus): string {
    const m: Record<InvestigationStatus, string> = {
      [InvestigationStatus.Pending]: '待开始',
      [InvestigationStatus.InProgress]: '进行中',
      [InvestigationStatus.Completed]: '已完成',
      [InvestigationStatus.Closed]: '已关闭',
    };
    return m[s];
  }
  getStatusClass(s: InvestigationStatus): string {
    const m: Record<InvestigationStatus, string> = {
      [InvestigationStatus.Pending]: 'status-pending',
      [InvestigationStatus.InProgress]: 'status-inprogress',
      [InvestigationStatus.Completed]: 'status-completed',
      [InvestigationStatus.Closed]: 'status-closed',
    };
    return m[s];
  }
  getCategoryText(c: string): string {
    const m: Record<string, string> = {
      environment: '环境因素',
      husbandry: '饲养管理',
      infection: '感染性疾病',
      procedure: '操作/实验相关',
      transport: '运输/搬运应激',
      genetic: '遗传/品系相关',
      unknown: '未确定',
      other: '其他',
    };
    return m[c] || c;
  }
}

@Component({
  selector: 'app-death-investigation-list',
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
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <div class="toolbar">
        <div class="search-bar">
          <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
            <mat-form-field appearance="outline" class="search-input">
              <mat-label>搜索调查</mat-label>
              <input matInput formControlName="searchKeyword" placeholder="调查号/批次/调查员/根因" />
              <button mat-icon-button matSuffix (click)="onSearch()" type="button">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
          </form>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon>
            创建调查
          </button>
        </div>
      </div>

      <div class="stats-bar" *ngIf="stats.total > 0">
        <div class="stat-card pending">
          <div class="stat-label">待开始</div>
          <div class="stat-number">{{ stats.pending }}</div>
        </div>
        <div class="stat-card inprogress">
          <div class="stat-label">进行中</div>
          <div class="stat-number">{{ stats.inprogress }}</div>
        </div>
        <div class="stat-card completed">
          <div class="stat-label">已完成</div>
          <div class="stat-number">{{ stats.completed }}</div>
        </div>
        <div class="stat-card closed">
          <div class="stat-label">已关闭</div>
          <div class="stat-number">{{ stats.closed }}</div>
        </div>
        <div class="stat-card total">
          <div class="stat-label">总计</div>
          <div class="stat-number">{{ stats.total }}</div>
        </div>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="investigationNumber">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>调查号</th>
            <td mat-cell *matCellDef="let row">
              <span class="inv-number">{{ row.investigationNumber }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="deathRecord">
            <th mat-header-cell *matHeaderCellDef>关联死亡记录</th>
            <td mat-cell *matCellDef="let row">
              <ng-container *ngIf="row.deathRecordId">
                <span class="death-link" (click)="viewDeath(row.deathRecordId!)">
                  D{{ row.deathRecordId?.slice(-6).toUpperCase() }}
                  <mat-icon inline>open_in_new</mat-icon>
                </span>
                <div class="sub-text" *ngIf="deathRecordMap.get(row.deathRecordId!)">
                  {{ deathRecordMap.get(row.deathRecordId!)?.causeOfDeath || '' }}
                </div>
              </ng-container>
              <span *ngIf="!row.deathRecordId" class="text-muted">-</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="batch">
            <th mat-header-cell *matHeaderCellDef>批次</th>
            <td mat-cell *matCellDef="let row">
              <span class="batch-chip">{{ row.batch?.batchCode || batchMap.get(row.batchId)?.batchCode || '-' }}</span>
              <div class="sub-text">{{ row.batch?.species || batchMap.get(row.batchId)?.species || '' }}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="investigator">
            <th mat-header-cell *matHeaderCellDef>调查员</th>
            <td mat-cell *matCellDef="let row">
              <div>{{ (row as any).investigator || (row as any).investigatorName || '-' }}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="startDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>开始日期</th>
            <td mat-cell *matCellDef="let row">{{ row.startDate | date: 'yyyy-MM-dd' }}</td>
          </ng-container>

          <ng-container matColumnDef="completeDate">
            <th mat-header-cell *matHeaderCellDef>完成日期</th>
            <td mat-cell *matCellDef="let row">
              {{ (row as any).endDate || (row as any).completeDate ? ((row as any).endDate || (row as any).completeDate | date:'yyyy-MM-dd') : '-' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="rootCauseCategory">
            <th mat-header-cell *matHeaderCellDef>根因分类</th>
            <td mat-cell *matCellDef="let row">
              <ng-container *ngIf="(row as any).rootCauseCategory; else noCause">
                <mat-chip-listbox>
                  <mat-chip highlighted color="accent">
                    {{ getCategoryText((row as any).rootCauseCategory) }}
                  </mat-chip>
                </mat-chip-listbox>
              </ng-container>
              <ng-template #noCause>
                <span class="text-muted pending-cause">待确认</span>
              </ng-template>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>调查状态</th>
            <td mat-cell *matCellDef="let row">
              <span [class]="getStatusClass(row.status)">
                <mat-icon class="status-icon">{{ getStatusIcon(row.status) }}</mat-icon>
                {{ getStatusText(row.status) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button [matMenuTriggerFor]="actionMenu" aria-label="操作">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item (click)="viewDetail(row)">
                  <mat-icon>visibility</mat-icon>
                  <span>查看详情</span>
                </button>
                <button mat-menu-item
                        (click)="completeInvestigation(row)"
                        [disabled]="row.status === InvestigationStatus.Completed || row.status === InvestigationStatus.Closed">
                  <mat-icon>check_circle</mat-icon>
                  <span>完成调查</span>
                </button>
                <button mat-menu-item
                        (click)="closeInvestigation(row)"
                        [disabled]="row.status === InvestigationStatus.Closed">
                  <mat-icon>lock</mat-icon>
                  <span>关闭</span>
                </button>
                <button mat-menu-item class="danger-item"
                        (click)="deleteInvestigation(row)"
                        [disabled]="row.status === InvestigationStatus.Closed">
                  <mat-icon>delete</mat-icon>
                  <span>删除</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              [class.row-closed]="row.status === InvestigationStatus.Closed"
              [class.row-completed]="row.status === InvestigationStatus.Completed">
          </tr>
        </table>

        <div class="empty-state" *ngIf="dataSource.data.length === 0">
          <mat-icon>assignment_turned_in</mat-icon>
          <p>暂无调查记录</p>
          <button mat-raised-button color="primary" (click)="openCreate()" style="margin-top: 16px;">
            <mat-icon>add</mat-icon>
            启动首项调查
          </button>
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
    .search-input { min-width: 320px; max-width: 520px; }
    .actions { display: flex; gap: 8px; }
    .stats-bar { display: flex; gap: 12px; margin-bottom: 16px; }
    .stat-card {
      flex: 1;
      padding: 14px 16px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-card.pending { background: linear-gradient(135deg, #e3f2fd, #bbdefb); }
    .stat-card.inprogress { background: linear-gradient(135deg, #fff3e0, #ffe0b2); }
    .stat-card.completed { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); }
    .stat-card.closed { background: linear-gradient(135deg, #eceff1, #cfd8dc); }
    .stat-card.total { background: linear-gradient(135deg, #f3e5f5, #e1bee7); }
    .stat-number { font-size: 24px; font-weight: 700; color: #333; margin-top: 4px; }
    .stat-label { font-size: 12px; color: #666; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .inv-number { color: #1565c0; font-weight: 600; font-family: 'SF Mono', Menlo, monospace; font-size: 13px; }
    .sub-text { font-size: 11px; color: #999; margin-top: 2px; }
    .batch-chip { background: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 10px; font-size: 12px; font-weight: 500; }
    .death-link { color: #d32f2f; cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 2px; }
    .death-link:hover { text-decoration: underline; }
    .text-muted { color: #9e9e9e; }
    .pending-cause { font-size: 12px; font-style: italic; }
    .status-pending { background: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
    .status-inprogress { background: #fff3e0; color: #e65100; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
    .status-completed { background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
    .status-closed { background: #e0e0e0; color: #616161; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
    .status-icon { font-size: 14px; width: 14px; height: 14px; }
    .row-closed { background: #f5f5f5; opacity: 0.7; }
    .row-completed { background: #f8fff8; }
    .danger-item { color: #f44336 !important; }
    .empty-state { padding: 60px 24px; text-align: center; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.4; }
    .empty-state p { margin: 0; font-size: 14px; }
  `]
})
export class DeathInvestigationListComponent implements OnInit {
  private service = inject(DeathInvestigationService);
  private deathRecordService = inject(DeathRecordService);
  private animalBatchService = inject(AnimalBatchService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly InvestigationStatus = InvestigationStatus;

  searchForm: FormGroup;
  dataSource = new MatTableDataSource<DeathInvestigation>([]);
  displayedColumns: string[] = [
    'investigationNumber', 'deathRecord', 'batch', 'investigator',
    'startDate', 'completeDate', 'rootCauseCategory', 'status', 'actions'
  ];

  pageIndex = 0;
  pageSize = 25;
  totalCount = 0;
  sortField = 'createdAt';
  sortDirection = 'desc';

  stats = { pending: 0, inprogress: 0, completed: 0, closed: 0, total: 0 };
  batchMap = new Map<string, AnimalBatch>();
  deathRecordMap = new Map<string, DeathRecord>();
  activeBatches: AnimalBatch[] = [];
  uninvestigatedDeaths: DeathRecord[] = [];

  constructor() {
    this.searchForm = this.fb.group({
      searchKeyword: [''],
    });
  }

  ngOnInit(): void {
    this.loadReferences();
    this.loadData();
  }

  loadReferences(): void {
    this.animalBatchService.getActive().subscribe({
      next: (res) => {
        this.activeBatches = res.data || [];
        this.activeBatches.forEach(b => this.batchMap.set(b.id, b));
      },
    });
    this.deathRecordService.getAbnormalUninvestigated().subscribe({
      next: (res) => this.uninvestigatedDeaths = res.data || [],
    });
  }

  calculateStats(): void {
    this.stats = { pending: 0, inprogress: 0, completed: 0, closed: 0, total: this.dataSource.data.length };
    this.dataSource.data.forEach(inv => {
      switch (inv.status) {
        case InvestigationStatus.Pending: this.stats.pending++; break;
        case InvestigationStatus.InProgress: this.stats.inprogress++; break;
        case InvestigationStatus.Completed: this.stats.completed++; break;
        case InvestigationStatus.Closed: this.stats.closed++; break;
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
    this.service.getPaged(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dataSource.data = (res.data as PagedResult<DeathInvestigation>).items;
          this.totalCount = (res.data as PagedResult<DeathInvestigation>).totalCount;
          this.loadRelatedDeaths();
          this.calculateStats();
        }
      },
      error: () => this.snackBar.open('加载调查失败', '关闭', { duration: 3000 }),
    });
  }

  loadRelatedDeaths(): void {
    const ids = this.dataSource.data.filter(i => i.deathRecordId).map(i => i.deathRecordId!);
    if (ids.length === 0) return;
    let loaded = 0;
    ids.forEach(id => {
      if (this.deathRecordMap.has(id)) { loaded++; if (loaded === ids.length) this.calculateStats(); return; }
      this.deathRecordService.getById(id).subscribe({
        next: (res) => {
          if (res.success && res.data) this.deathRecordMap.set(id, res.data as DeathRecord);
          loaded++;
          if (loaded === ids.length) this.calculateStats();
        },
        error: () => { loaded++; if (loaded === ids.length) this.calculateStats(); },
      });
    });
  }

  getStatusText(s: InvestigationStatus): string {
    const m: Record<InvestigationStatus, string> = {
      [InvestigationStatus.Pending]: '待开始',
      [InvestigationStatus.InProgress]: '进行中',
      [InvestigationStatus.Completed]: '已完成',
      [InvestigationStatus.Closed]: '已关闭',
    };
    return m[s];
  }

  getStatusClass(s: InvestigationStatus): string {
    const m: Record<InvestigationStatus, string> = {
      [InvestigationStatus.Pending]: 'status-pending',
      [InvestigationStatus.InProgress]: 'status-inprogress',
      [InvestigationStatus.Completed]: 'status-completed',
      [InvestigationStatus.Closed]: 'status-closed',
    };
    return m[s];
  }

  getStatusIcon(s: InvestigationStatus): string {
    const m: Record<InvestigationStatus, string> = {
      [InvestigationStatus.Pending]: 'schedule',
      [InvestigationStatus.InProgress]: 'play_circle',
      [InvestigationStatus.Completed]: 'check_circle',
      [InvestigationStatus.Closed]: 'lock',
    };
    return m[s];
  }

  getCategoryText(c: string): string {
    const m: Record<string, string> = {
      environment: '环境因素',
      husbandry: '饲养管理',
      infection: '感染性疾病',
      procedure: '操作/实验相关',
      transport: '运输应激',
      genetic: '遗传相关',
      unknown: '未确定',
      other: '其他',
    };
    return m[c] || c;
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

  openCreate(): void {
    const dialogRef = this.dialog.open(InvestigationCreateDialogComponent, {
      width: '680px',
      data: { batches: this.activeBatches, uninvestigated: this.uninvestigatedDeaths },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  viewDetail(inv: DeathInvestigation): void {
    this.dialog.open(InvestigationDetailDialogComponent, {
      width: '760px',
      data: {
        investigation: inv,
        batch: this.batchMap.get(inv.batchId),
        deathRecord: inv.deathRecordId ? this.deathRecordMap.get(inv.deathRecordId) : null,
      },
    });
  }

  viewDeath(id: string): void {
    const rec = this.deathRecordMap.get(id);
    if (!rec) {
      this.snackBar.open('死亡记录加载中，请稍后', '关闭', { duration: 2000 });
      return;
    }
    this.snackBar.open(
      `死亡记录 D${id.slice(-6).toUpperCase()} - 原因: ${rec.causeOfDeath || '未填写'}`,
      '关闭',
      { duration: 4000 }
    );
  }

  completeInvestigation(inv: DeathInvestigation): void {
    const dialogRef = this.dialog.open(InvestigationCompleteDialogComponent, {
      width: '680px',
      data: { investigation: inv },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  closeInvestigation(inv: DeathInvestigation): void {
    if (!confirm(`确认关闭调查 ${inv.investigationNumber}？\n关闭后将无法再修改。`)) return;
    this.service.close(inv.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('调查已关闭', '关闭', { duration: 3000 });
          this.loadData();
        } else {
          this.snackBar.open(res.message || '操作失败', '关闭', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('操作失败', '关闭', { duration: 3000 }),
    });
  }

  deleteInvestigation(inv: DeathInvestigation): void {
    if (inv.status === InvestigationStatus.Completed || inv.status === InvestigationStatus.InProgress) {
      if (!confirm(`该调查为${this.getStatusText(inv.status)}状态，删除将丢失相关数据，确认继续？`)) return;
    }
    if (!confirm(`确认删除调查 ${inv.investigationNumber}？\n此操作不可撤销。`)) return;
    this.service.delete(inv.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('调查已删除', '关闭', { duration: 3000 });
          this.loadData();
        } else {
          this.snackBar.open(res.message || '删除失败', '关闭', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('删除失败', '关闭', { duration: 3000 }),
    });
  }
}
