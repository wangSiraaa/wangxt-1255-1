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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { QuarantineService } from '../core/services';
import { AnimalBatch, QuarantineRecord, QuarantineRecordCompleteDto } from '../core/models';

interface DialogData {
  mode: 'start' | 'complete';
  batchId?: string;
  batches?: AnimalBatch[];
  record?: QuarantineRecord;
}

@Component({
  selector: 'app-quarantine-dialog',
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
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.mode === 'start' ? 'play_arrow' : 'check_circle' }}</mat-icon>
      {{ data.mode === 'start' ? '开始检疫' : '完成检疫' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form" *ngIf="data.mode === 'start'">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>动物批次 *</mat-label>
            <mat-select formControlName="batchId">
              <mat-option *ngFor="let batch of data.batches || []" [value]="batch.id">
                {{ batch.batchCode }} - {{ batch.species }} (当前: {{ batch.currentQuantity }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('batchId')?.hasError('required')">
              请选择批次
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>笼位</mat-label>
            <mat-select formControlName="cageLocationId">
              <mat-option value="">-- 无分配笼位 --</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>兽医</mat-label>
            <input matInput formControlName="veterinarianId" placeholder="请输入或选择兽医" maxlength="50" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>开始日期 *</mat-label>
            <input matInput [matDatepicker]="dpStart" formControlName="startDate" />
            <mat-datepicker-toggle matIconSuffix [for]="dpStart"></mat-datepicker-toggle>
            <mat-datepicker #dpStart></mat-datepicker>
            <mat-error *ngIf="form.get('startDate')?.hasError('required')">
              请选择开始日期
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>预计结束日期</mat-label>
            <input matInput [matDatepicker]="dpEnd" formControlName="plannedEndDate" />
            <mat-datepicker-toggle matIconSuffix [for]="dpEnd"></mat-datepicker-toggle>
            <mat-datepicker #dpEnd></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>检疫天数</mat-label>
            <input matInput type="number" formControlName="quarantineDays" min="1" max="90" placeholder="默认14天" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>观察项目</mat-label>
            <textarea matInput formControlName="observationItems" rows="2" placeholder="如：食欲、精神状态、粪便情况等" maxlength="500"></textarea>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>备注</mat-label>
            <textarea matInput formControlName="notes" rows="2" placeholder="可选，填写其他说明" maxlength="500"></textarea>
          </mat-form-field>
        </div>
      </form>

      <form [formGroup]="form" class="dialog-form" *ngIf="data.mode === 'complete'">
        <div class="info-panel" *ngIf="data.record">
          <div class="info-row">
            <span class="label">检疫号:</span>
            <span class="value">Q{{ data.record.id.slice(-6).toUpperCase() }}</span>
          </div>
          <div class="info-row">
            <span class="label">批次:</span>
            <span class="value">{{ data.record.batch?.batchCode || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">开始日期:</span>
            <span class="value">{{ data.record.startDate | date: 'yyyy-MM-dd' }}</span>
          </div>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>结束日期 *</mat-label>
            <input matInput [matDatepicker]="dpComplete" formControlName="endDate" />
            <mat-datepicker-toggle matIconSuffix [for]="dpComplete"></mat-datepicker-toggle>
            <mat-datepicker #dpComplete></mat-datepicker>
            <mat-error *ngIf="form.get('endDate')?.hasError('required')">
              请选择结束日期
            </mat-error>
          </mat-form-field>

          <div class="toggle-container">
            <label class="toggle-label">检疫结果</label>
            <mat-slide-toggle formControlName="isPassed" color="primary">
              {{ form.get('isPassed')?.value ? '通过' : '不通过' }}
            </mat-slide-toggle>
          </div>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>结果备注 {{ form.get('isPassed')?.value === false ? '*' : '' }}</mat-label>
            <textarea
              matInput
              formControlName="resultNotes"
              rows="4"
              [placeholder]="form.get('isPassed')?.value === false ? '请说明不通过原因及处理措施' : '可选，填写检疫结果说明'"
              maxlength="1000">
            </textarea>
            <mat-error *ngIf="form.get('resultNotes')?.hasError('requiredWhenFailed')">
              检疫不通过时必须填写结果备注
            </mat-error>
          </mat-form-field>
        </div>

        <div class="warning-panel" *ngIf="form.get('isPassed')?.value === false">
          <mat-icon color="warn">warning</mat-icon>
          <span>检疫不通过将触发后续处理流程，请确保备注信息完整。</span>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        <mat-icon>cancel</mat-icon>
        取消
      </button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!form.valid || isSubmitting">
        <mat-icon *ngIf="!isSubmitting">{{ data.mode === 'start' ? 'play_arrow' : 'check' }}</mat-icon>
        <mat-icon *ngIf="isSubmitting" class="spinner">sync</mat-icon>
        {{ isSubmitting ? '提交中...' : (data.mode === 'start' ? '确认开始' : '确认完成') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { padding-top: 16px; min-width: 520px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 8px; }
    .form-row > mat-form-field, .form-row > .toggle-container { flex: 1; }
    .full-width { flex: 1; }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .toggle-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    .toggle-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }
    .info-panel {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .info-row .label {
      color: #666;
      font-size: 13px;
    }
    .info-row .value {
      font-weight: 500;
      color: #333;
    }
    .warning-panel {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #fff3e0;
      color: #e65100;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      margin-top: 8px;
    }
  `]
})
export class QuarantineDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<QuarantineDialogComponent>);
  private quarantineService = inject(QuarantineService);
  private snackBar = inject(MatSnackBar);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.buildForm();
    if (this.data.mode === 'start' && this.data.batchId) {
      this.form.get('batchId')?.setValue(this.data.batchId);
    }
    if (this.data.mode === 'complete') {
      this.form.patchValue({
        endDate: new Date(),
      });
    }
  }

  buildForm(): void {
    if (this.data.mode === 'start') {
      this.form = this.fb.group({
        batchId: ['', Validators.required],
        cageLocationId: [''],
        veterinarianId: [''],
        startDate: [new Date(), Validators.required],
        plannedEndDate: [''],
        quarantineDays: [14],
        observationItems: ['常规观察：食欲、精神状态、粪便、外观等'],
        notes: [''],
      });
    } else {
      this.form = this.fb.group({
        endDate: [new Date(), Validators.required],
        isPassed: [true],
        resultNotes: [''],
      }, {
        validators: [this.resultRequiredWhenFailed()],
      });
    }
  }

  resultRequiredWhenFailed(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isPassed = control.get('isPassed')?.value;
      const notes = control.get('resultNotes')?.value;
      if (isPassed === false && (!notes || !notes.trim())) {
        control.get('resultNotes')?.setErrors({ requiredWhenFailed: true });
        return { requiredWhenFailed: true };
      }
      return null;
    };
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    this.isSubmitting = true;
    const formValue = this.form.getRawValue();

    if (this.data.mode === 'start') {
      const dto = {
        batchId: formValue.batchId,
        startDate: formValue.startDate,
        quarantineDays: Number(formValue.quarantineDays) || 14,
        observationItems: formValue.observationItems,
        remarks: formValue.notes,
      };
      this.quarantineService.start(dto as any).subscribe({
        next: (res) => this.handleResponse(res),
        error: (e) => this.handleError(e),
      });
    } else {
      const record = this.data.record;
      if (!record) {
        this.isSubmitting = false;
        this.snackBar.open('检疫记录不存在', '关闭', { duration: 3000 });
        return;
      }
      const dto: QuarantineRecordCompleteDto = {
        endDate: formValue.endDate,
        results: formValue.resultNotes || (formValue.isPassed ? '检疫通过，动物状态正常' : '检疫不通过'),
        isPassed: !!formValue.isPassed,
      };
      this.quarantineService.complete(record.id, dto).subscribe({
        next: (res) => this.handleResponse(res),
        error: (e) => this.handleError(e),
      });
    }
  }

  handleResponse(res: any): void {
    this.isSubmitting = false;
    if (res.success) {
      this.dialogRef.close(res.data);
    } else {
      this.snackBar.open(res.message || '提交失败', '关闭', { duration: 3000 });
    }
  }

  handleError(_e: any): void {
    this.isSubmitting = false;
    this.snackBar.open('提交失败，请重试', '关闭', { duration: 3000 });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
