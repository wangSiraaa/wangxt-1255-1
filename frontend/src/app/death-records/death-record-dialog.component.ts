import { Component, Inject, inject, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { DeathRecordService } from '../core/services';
import { AnimalBatch, DeathRecord, DeathType, DeathRecordCreateDto } from '../core/models';

interface DialogData {
  mode: 'create' | 'edit';
  batches: AnimalBatch[];
  record?: DeathRecord;
}

@Component({
  selector: 'app-death-record-dialog',
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
    MatRadioModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>report</mat-icon>
      {{ data.mode === 'create' ? '新增死亡记录' : '死亡记录详情' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="warning-panel abnormal" *ngIf="form.get('deathType')?.value === DeathType.Abnormal">
          <mat-icon color="warn">warning_amber</mat-icon>
          <div>
            <strong>异常死亡提示</strong>
            <p>该死亡类型将触发后续调查流程，请在保存后创建调查记录。</p>
          </div>
        </div>

        <div class="warning-panel unknown" *ngIf="form.get('deathType')?.value === DeathType.Unknown">
          <mat-icon color="warn">help_outline</mat-icon>
          <div>
            <strong>死因不明提示</strong>
            <p>建议尽快进行死因鉴定并创建调查。</p>
          </div>
        </div>

        <div class="section-title">动物信息</div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>所属批次 *</mat-label>
            <mat-select formControlName="batchId">
              <mat-option *ngFor="let batch of data.batches || []" [value]="batch.id">
                {{ batch.batchCode }} - {{ batch.species }} {{ batch.strain }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('batchId')?.hasError('required')">
              请选择批次
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>动物耳标/芯片</mat-label>
            <input matInput formControlName="earTagOrChip" placeholder="输入耳标号或芯片号" maxlength="50" />
          </mat-form-field>
        </div>

        <div class="section-title">死亡信息</div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>死亡日期 *</mat-label>
            <input matInput [matDatepicker]="dp" formControlName="deathDate" />
            <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
            <mat-datepicker #dp></mat-datepicker>
            <mat-error *ngIf="form.get('deathDate')?.hasError('required')">
              请选择日期
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>死亡时间</mat-label>
            <input matInput type="time" formControlName="deathTime" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <div class="death-type-group">
            <label class="field-label">死亡类型 *</label>
            <mat-radio-group formControlName="deathType" class="radio-row">
              <mat-radio-button [value]="DeathType.Normal" color="primary">
                <span class="radio-normal">正常死亡</span>
              </mat-radio-button>
              <mat-radio-button [value]="DeathType.Abnormal" color="warn">
                <span class="radio-abnormal">异常死亡</span>
              </mat-radio-button>
              <mat-radio-button [value]="DeathType.Euthanasia">
                <span class="radio-euthanasia">安乐死</span>
              </mat-radio-button>
              <mat-radio-button [value]="DeathType.Unknown">
                <span class="radio-unknown">未知</span>
              </mat-radio-button>
            </mat-radio-group>
          </div>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>死亡原因</mat-label>
            <input matInput formControlName="deathCause" placeholder="如：心力衰竭、意外等" maxlength="200" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>发现位置</mat-label>
            <input matInput formControlName="locationFound" placeholder="如：A区R01笼架第2层" maxlength="100" />
          </mat-form-field>
        </div>

        <div class="section-title">处理信息</div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>处理兽医</mat-label>
            <input matInput formControlName="veterinarianId" placeholder="兽医姓名或工号" maxlength="50" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>处理方式</mat-label>
            <mat-select formControlName="handlingMethod">
              <mat-option value="">-- 请选择 --</mat-option>
              <option value="incineration">高温焚烧</option>
              <option value="autoclave">高压灭菌后处理</option>
              <option value="deep_burial">深埋处理</option>
              <option value="necropsy">送检尸检</option>
              <option value="other">其他</option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>数量</mat-label>
            <input matInput type="number" formControlName="deathCount" min="1" />
            <mat-hint>通常为1；批量记录时可填写更多</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>上报人</mat-label>
            <input matInput formControlName="reportedBy" placeholder="当前用户" maxlength="50" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>备注</mat-label>
            <textarea
              matInput
              formControlName="notes"
              rows="3"
              placeholder="可选，填写其他相关信息（同笼动物情况、现场照片编号等）"
              maxlength="1000">
            </textarea>
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
        <mat-icon *ngIf="!isSubmitting">{{ data.mode === 'create' ? 'add' : 'save' }}</mat-icon>
        <mat-icon *ngIf="isSubmitting" class="spinner">sync</mat-icon>
        {{ isSubmitting ? '保存中...' : (data.mode === 'create' ? '创建记录' : '保存修改') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { padding-top: 12px; min-width: 600px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 4px; }
    .form-row > mat-form-field, .form-row > .death-type-group { flex: 1; }
    .full-width { flex: 1; }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #1976d2;
      padding: 16px 0 8px;
      border-bottom: 1px solid #e3f2fd;
      margin-bottom: 12px;
    }
    .field-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
      display: block;
    }
    .radio-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    .radio-normal { color: #2e7d32; }
    .radio-abnormal { color: #c62828; font-weight: 500; }
    .radio-euthanasia { color: #6a1b9a; }
    .radio-unknown { color: #616161; }
    .warning-panel {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .warning-panel strong { display: block; margin-bottom: 4px; }
    .warning-panel p { margin: 0; font-size: 12px; }
    .warning-panel.abnormal {
      background: #ffebee;
      border: 1px solid #ffcdd2;
      color: #c62828;
    }
    .warning-panel.unknown {
      background: #fff8e1;
      border: 1px solid #ffecb3;
      color: #f57f17;
    }
  `]
})
export class DeathRecordDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DeathRecordDialogComponent>);
  private deathRecordService = inject(DeathRecordService);
  private snackBar = inject(MatSnackBar);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly DeathType = DeathType;

  form!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.buildForm();
    if (this.data.mode === 'edit' && this.data.record) {
      this.form.patchValue({
        batchId: this.data.record.batchId,
        earTagOrChip: this.data.record.animal?.tagNumber || this.data.record.animal?.animalNumber || '',
        deathDate: this.data.record.deathDate,
        deathTime: '',
        deathType: this.data.record.deathType,
        deathCause: this.data.record.causeOfDeath || '',
        locationFound: this.data.record.location || '',
        veterinarianId: '',
        handlingMethod: '',
        deathCount: this.data.record.deathCount || 1,
        reportedBy: this.data.record.reportedBy || '',
        notes: this.data.record.remarks || '',
      });
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      batchId: ['', Validators.required],
      earTagOrChip: [''],
      deathDate: [new Date(), Validators.required],
      deathTime: [this.getCurrentTime()],
      deathType: [DeathType.Normal, Validators.required],
      deathCause: [''],
      locationFound: [''],
      veterinarianId: [''],
      handlingMethod: [''],
      deathCount: [1, [Validators.required, Validators.min(1)]],
      reportedBy: [''],
      notes: [''],
    });
  }

  getCurrentTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    this.isSubmitting = true;
    const fv = this.form.getRawValue();

    if (this.data.mode === 'edit' && this.data.record) {
      this.deathRecordService.update(this.data.record.id, {
        batchId: fv.batchId,
        animalId: this.data.record.animalId,
        deathDate: fv.deathDate,
        deathType: Number(fv.deathType),
        deathCount: Number(fv.deathCount),
        causeOfDeath: fv.deathCause,
        location: fv.locationFound,
        reportedBy: fv.reportedBy,
        isInvestigated: this.data.record.isInvestigated,
        remarks: fv.notes,
      } as any).subscribe({
        next: (res) => this.handleResponse(res),
        error: (e) => this.handleError(e),
      });
    } else {
      this.deathRecordService.create({
        batchId: fv.batchId,
        deathDate: fv.deathDate,
        deathType: Number(fv.deathType),
        deathCount: Number(fv.deathCount),
        causeOfDeath: fv.deathCause,
        location: fv.locationFound,
        reportedBy: fv.reportedBy || '当前用户',
        remarks: fv.notes,
      } as DeathRecordCreateDto).subscribe({
        next: (res) => this.handleResponse(res),
        error: (e) => this.handleError(e),
      });
    }
  }

  handleResponse(res: any): void {
    this.isSubmitting = false;
    if (res.success) {
      const type = Number(this.form.get('deathType')?.value);
      if ((type === DeathType.Abnormal || type === DeathType.Unknown) && this.data.mode === 'create') {
        setTimeout(() => {
          this.snackBar.open('提示：请记得为异常/未知死亡创建调查记录', '我知道了', { duration: 5000 });
        }, 500);
      }
      this.dialogRef.close(res.data);
    } else {
      this.snackBar.open(res.message || '保存失败', '关闭', { duration: 3000 });
    }
  }

  handleError(_e: any): void {
    this.isSubmitting = false;
    this.snackBar.open('保存失败，请重试', '关闭', { duration: 3000 });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
