import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AnimalOrderService } from '../../core/services/animal-order.service';
import { AnimalOrder, OrderStatus, Gender, PagedQueryParams, AnimalOrderReceiveDto } from '../../core/models';
import { AnimalOrderDialogComponent } from './animal-order-dialog.component';

@Component({
  selector: 'app-receive-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>接收订单 - {{ data.orderNumber }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="receive-content">
        <div class="info-tip">
          <mat-icon>info</mat-icon>
          <span>原订单数量：<strong>{{ data.quantity }}</strong></span>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>实际到货日期 *</mat-label>
            <input matInput [matDatepicker]="arrDp" formControlName="actualArrivalDate">
            <mat-datepicker-toggle matSuffix [for]="arrDp"></mat-datepicker-toggle>
            <mat-datepicker #arrDp></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>实际到货数量 *</mat-label>
            <input matInput type="number" formControlName="actualQuantity" min="1">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>批次编号 *</mat-label>
            <input matInput formControlName="batchCode" placeholder="如：BAT202606001">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>存放位置 *</mat-label>
            <input matInput formControlName="location" placeholder="如：A区-3号房">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>备注说明</mat-label>
          <textarea matInput formControlName="remarks" rows="2"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close(false)">取消</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || isSubmitting">
          确认接收
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .receive-content { min-width: 520px; padding: 8px 0; }
    .info-tip { display: flex; align-items: center; gap: 8px; padding: 12px;
      background: #e3f2fd; border-radius: 8px; margin-bottom: 12px; color: #1565c0; font-size: 13px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 4px; }
    .full-width { width: 100%; }
    mat-form-field { width: 100%; }
  `]
})
export class ReceiveDialogComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<ReceiveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AnimalOrder,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      actualArrivalDate: [new Date(), Validators.required],
      actualQuantity: [this.data.quantity, [Validators.required, Validators.min(1)]],
      batchCode: ['', Validators.required],
      location: ['', Validators.required],
      remarks: ['']
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value as AnimalOrderReceiveDto);
    }
  }
}

@Component({
  selector: 'app-animal-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './animal-order-list.component.html',
  styleUrls: ['./animal-order-list.component.scss']
})
export class AnimalOrderListComponent implements OnInit {
  displayedColumns: string[] = [
    'orderNumber', 'researchGroup', 'ethicsApproval', 'speciesInfo',
    'quantity', 'supplier', 'status', 'createdAt', 'actions'
  ];
  dataSource = new MatTableDataSource<AnimalOrder>();
  totalCount = 0;
  isLoading = false;

  searchControl = new FormControl('');
  pageIndex = 0;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private animalOrderService: AnimalOrderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadData();
      });

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    const params: PagedQueryParams = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      sortField: 'createdAt',
      sortDirection: 'desc',
      searchKeyword: this.searchControl.value || ''
    };

    this.animalOrderService.getPaged(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dataSource.data = res.data.items;
          this.totalCount = res.data.totalCount;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('加载数据失败', '关闭', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  getStatusText(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      [OrderStatus.Draft]: '草稿',
      [OrderStatus.Submitted]: '待审批',
      [OrderStatus.Approved]: '已批准',
      [OrderStatus.Rejected]: '已拒绝',
      [OrderStatus.InTransit]: '运输中',
      [OrderStatus.Received]: '已接收',
      [OrderStatus.Cancelled]: '已取消'
    };
    return map[status] || '未知';
  }

  getStatusClass(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      [OrderStatus.Draft]: 'status-draft',
      [OrderStatus.Submitted]: 'status-submitted',
      [OrderStatus.Approved]: 'status-approved',
      [OrderStatus.Rejected]: 'status-rejected',
      [OrderStatus.InTransit]: 'status-intransit',
      [OrderStatus.Received]: 'status-received',
      [OrderStatus.Cancelled]: 'status-cancelled'
    };
    return map[status] || '';
  }

  getGenderText(gender: Gender): string {
    const map: Record<Gender, string> = {
      [Gender.Male]: '雄',
      [Gender.Female]: '雌',
      [Gender.Unknown]: '未知'
    };
    return map[gender] || '';
  }

  canSubmit(row: AnimalOrder): boolean {
    return row.status === OrderStatus.Draft;
  }

  canApprove(row: AnimalOrder): boolean {
    return row.status === OrderStatus.Submitted;
  }

  canMarkTransit(row: AnimalOrder): boolean {
    return row.status === OrderStatus.Approved;
  }

  canReceive(row: AnimalOrder): boolean {
    return row.status === OrderStatus.InTransit;
  }

  openDialog(data?: AnimalOrder): void {
    const dialogRef = this.dialog.open(AnimalOrderDialogComponent, {
      width: '700px',
      data: data || null,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
        this.snackBar.open(data ? '更新成功' : '创建成功', '关闭', { duration: 3000 });
      }
    });
  }

  onSubmitOrder(row: AnimalOrder): void {
    this.animalOrderService.submit(row.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('提交成功', '关闭', { duration: 3000 });
          this.loadData();
        } else {
          this.snackBar.open(res.message || '提交失败', '关闭', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('提交失败', '关闭', { duration: 3000 })
    });
  }

  onApprove(row: AnimalOrder): void {
    const ref = this.dialog.open(ApproveRejectDialogComponent, {
      width: '480px',
      data: { mode: 'approve' }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.animalOrderService.approve(row.id, { remarks: result.remarks }).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('审批通过', '关闭', { duration: 3000 });
              this.loadData();
            } else {
              this.snackBar.open(res.message || '操作失败', '关闭', { duration: 3000 });
            }
          }
        });
      }
    });
  }

  onReject(row: AnimalOrder): void {
    const ref = this.dialog.open(ApproveRejectDialogComponent, {
      width: '480px',
      data: { mode: 'reject' }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.animalOrderService.reject(row.id, { rejectionReason: result.reason }).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('已拒绝', '关闭', { duration: 3000 });
              this.loadData();
            } else {
              this.snackBar.open(res.message || '操作失败', '关闭', { duration: 3000 });
            }
          }
        });
      }
    });
  }

  onMarkTransit(row: AnimalOrder): void {
    this.animalOrderService.markInTransit(row.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('已标记为运输中', '关闭', { duration: 3000 });
          this.loadData();
        } else {
          this.snackBar.open(res.message || '操作失败', '关闭', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('操作失败', '关闭', { duration: 3000 })
    });
  }

  onReceive(row: AnimalOrder): void {
    const ref = this.dialog.open(ReceiveDialogComponent, {
      width: '600px',
      data: row,
      disableClose: true
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.animalOrderService.receive(row.id, result).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('接收成功，批次已创建', '关闭', { duration: 3000 });
              this.loadData();
            } else {
              this.snackBar.open(res.message || '接收失败', '关闭', { duration: 3000 });
            }
          },
          error: () => this.snackBar.open('接收失败', '关闭', { duration: 3000 })
        });
      }
    });
  }

  onView(row: AnimalOrder): void {
    this.dialog.open(AnimalOrderDialogComponent, {
      width: '700px',
      data: { ...row, isViewOnly: true }
    });
  }
}

@Component({
  selector: 'app-approve-reject-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'approve' ? '审批通过' : '审批拒绝' }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content style="min-width: 420px;">
        @if (data.mode === 'reject') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>拒绝原因 *</mat-label>
            <textarea matInput formControlName="reason" rows="3" placeholder="请输入拒绝原因"></textarea>
          </mat-form-field>
        } @else {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>审批备注</mat-label>
            <textarea matInput formControlName="remarks" rows="3" placeholder="选填"></textarea>
          </mat-form-field>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="ref.close(false)">取消</button>
        <button mat-raised-button [color]="data.mode === 'approve' ? 'primary' : 'warn'"
                type="submit" [disabled]="form.invalid">
          {{ data.mode === 'approve' ? '确认通过' : '确认拒绝' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: ['.full-width { width: 100%; } mat-form-field { width: 100%; }']
})
export class ApproveRejectDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    public ref: MatDialogRef<ApproveRejectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'approve' | 'reject' },
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      reason: ['', this.data.mode === 'reject' ? Validators.required : null],
      remarks: ['']
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.ref.close(this.form.value);
    }
  }
}
