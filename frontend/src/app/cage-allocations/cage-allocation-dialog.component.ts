import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CageAllocationService } from '../core/services';
import { AnimalBatch, CageLocation, CageAllocationCreateDto } from '../core/models';

interface DialogData {
  batches: AnimalBatch[];
  cages: CageLocation[];
  preselectedBatchId?: string;
}

@Component({
  selector: 'app-cage-allocation-dialog',
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
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>add_home</mat-icon>
      分配笼位
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>动物批次 *</mat-label>
            <mat-select formControlName="batchId" (selectionChange)="onBatchChange()">
              <mat-option *ngFor="let batch of data.batches" [value]="batch.id">
                {{ batch.batchCode }} - {{ batch.species }} ({{ batch.currentQuantity }}/{{ batch.totalQuantity }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('batchId')?.hasError('required')">
              请选择批次
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>分配日期 *</mat-label>
            <input matInput [matDatepicker]="dp" formControlName="allocationDate" />
            <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
            <mat-datepicker #dp></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>笼位 *</mat-label>
            <mat-select formControlName="cageLocationId" (selectionChange)="onCageChange()">
              <mat-option *ngFor="let cage of availableCageList" [value]="cage.id">
                {{ cage.cageNumber }} - {{ cage.locationDescription }}
                (可用: {{ cage.availableCapacity }} / 最大: {{ cage.maxCapacity }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('cageLocationId')?.hasError('required')">
              请选择笼位
            </mat-error>
            <mat-hint *ngIf="selectedCage">
              当前可用容量: <strong>{{ selectedCage.availableCapacity }}</strong>
            </mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>分配数量 *</mat-label>
            <input matInput type="number" formControlName="allocatedCount" min="1" />
            <mat-error *ngIf="form.get('allocatedCount')?.hasError('required')">
              请输入数量
            </mat-error>
            <mat-error *ngIf="form.get('allocatedCount')?.hasError('min')">
              数量至少为 1
            </mat-error>
            <mat-error *ngIf="form.get('allocatedCount')?.hasError('exceedsCapacity')">
              超过笼位可用容量
            </mat-error>
            <mat-error *ngIf="form.get('allocatedCount')?.hasError('exceedsBatch')">
              超过批次当前数量
            </mat-error>
          </mat-form-field>
        </div>

        <div class="capacity-summary" *ngIf="selectedCage && form.get('allocatedCount')?.value">
          <div class="summary-item">
            <span class="label">笼位可用:</span>
            <span class="value">{{ selectedCage.availableCapacity }}</span>
          </div>
          <div class="summary-arrow">
            <mat-icon>arrow_forward</mat-icon>
          </div>
          <div class="summary-item">
            <span class="label">本次分配:</span>
            <span class="value alloc">{{ form.get('allocatedCount')?.value || 0 }}</span>
          </div>
          <div class="summary-arrow">
            <mat-icon>arrow_forward</mat-icon>
          </div>
          <div class="summary-item">
            <span class="label">分配后剩余:</span>
            <span class="value remaining">
              {{ (selectedCage.availableCapacity || 0) - (form.get('allocatedCount')?.value || 0) }}
            </span>
          </div>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>分配人</mat-label>
            <input matInput formControlName="assignedBy" placeholder="当前用户" maxlength="50" />
          </mat-form-field>

          <mat-form-field appearance="outline"></mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>备注</mat-label>
            <textarea matInput formControlName="notes" rows="3" placeholder="可选，填写分配说明" maxlength="500"></textarea>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        <mat-icon>cancel</mat-icon>
        取消
      </button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!form.valid || isSubmitting">
        <mat-icon *ngIf="!isSubmitting">check</mat-icon>
        <mat-icon *ngIf="isSubmitting" class="spinner">sync</mat-icon>
        {{ isSubmitting ? '分配中...' : '确认分配' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { padding-top: 16px; min-width: 520px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 8px; }
    .form-row > mat-form-field { flex: 1; }
    .full-width { flex: 1; }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .capacity-summary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .summary-item {
      text-align: center;
      padding: 8px 16px;
      background: white;
      border-radius: 8px;
      min-width: 100px;
    }
    .summary-item .label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .summary-item .value {
      font-size: 20px;
      font-weight: 600;
      color: #1976d2;
    }
    .summary-item .value.alloc {
      color: #ff9800;
    }
    .summary-item .value.remaining {
      color: #4caf50;
    }
    .summary-arrow {
      color: #999;
    }
  `]
})
export class CageAllocationDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CageAllocationDialogComponent>);
  private cageAllocationService = inject(CageAllocationService);
  private snackBar = inject(MatSnackBar);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSubmitting = false;
  availableCageList: CageLocation[] = [];
  selectedCage: CageLocation | null = null;
  selectedBatch: AnimalBatch | null = null;

  ngOnInit(): void {
    this.availableCageList = [...(this.data.cages || [])];
    this.buildForm();
    if (this.data.preselectedBatchId) {
      this.form.get('batchId')?.setValue(this.data.preselectedBatchId);
      this.onBatchChange();
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      batchId: ['', Validators.required],
      cageLocationId: ['', Validators.required],
      allocatedCount: [null, [Validators.required, Validators.min(1)]],
      allocationDate: [new Date(), Validators.required],
      assignedBy: [''],
      notes: [''],
    }, {
      validators: [this.capacityValidator(), this.batchQuantityValidator()],
    });
  }

  capacityValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cageId = control.get('cageLocationId')?.value;
      const count = control.get('allocatedCount')?.value;
      if (!cageId || !count) return null;
      const cage = this.availableCageList.find(c => c.id === cageId);
      if (cage && count > cage.availableCapacity) {
        control.get('allocatedCount')?.setErrors({ exceedsCapacity: true });
        return { exceedsCapacity: true };
      }
      return null;
    };
  }

  batchQuantityValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const batchId = control.get('batchId')?.value;
      const count = control.get('allocatedCount')?.value;
      if (!batchId || !count) return null;
      const batch = this.data.batches?.find((b: AnimalBatch) => b.id === batchId);
      if (batch && count > batch.currentQuantity) {
        control.get('allocatedCount')?.setErrors({ exceedsBatch: true });
        return { exceedsBatch: true };
      }
      return null;
    };
  }

  onBatchChange(): void {
    const batchId = this.form.get('batchId')?.value;
    this.selectedBatch = this.data.batches?.find((b: AnimalBatch) => b.id === batchId) || null;
    if (this.selectedBatch) {
      const currentCount = this.form.get('allocatedCount')?.value;
      if (currentCount && currentCount > this.selectedBatch.currentQuantity) {
        this.form.get('allocatedCount')?.setValue(this.selectedBatch.currentQuantity);
      }
    }
  }

  onCageChange(): void {
    const cageId = this.form.get('cageLocationId')?.value;
    this.selectedCage = this.availableCageList.find(c => c.id === cageId) || null;
    if (this.selectedCage) {
      const currentCount = this.form.get('allocatedCount')?.value;
      if (!currentCount || currentCount > this.selectedCage.availableCapacity) {
        this.form.get('allocatedCount')?.setValue(this.selectedCage.availableCapacity);
      }
    }
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    this.isSubmitting = true;
    const formValue = this.form.getRawValue();
    const dto: CageAllocationCreateDto = {
      batchId: formValue.batchId,
      cageLocationId: formValue.cageLocationId,
      allocatedCount: Number(formValue.allocatedCount),
      remarks: formValue.notes,
    };
    this.cageAllocationService.allocate(dto).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.dialogRef.close(res.data);
        } else {
          this.snackBar.open(res.message || '分配失败', '关闭', { duration: 3000 });
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.snackBar.open('分配失败，请重试', '关闭', { duration: 3000 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
