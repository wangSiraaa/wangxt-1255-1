import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CageLocationService } from '../core/services';
import { CageLocation, CageLocationCreateDto, CageLocationUpdateDto } from '../core/models';

@Component({
  selector: 'app-cage-location-dialog',
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
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ isEdit ? 'edit' : 'add_home' }}</mat-icon>
      {{ isEdit ? '编辑笼位' : '新增笼位' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>位置编码 *</mat-label>
            <input matInput formControlName="locationCode" placeholder="如：CAG-001-A1" maxlength="50" />
            <mat-error *ngIf="form.get('locationCode')?.hasError('required')">
              请输入位置编码
            </mat-error>
            <mat-error *ngIf="form.get('locationCode')?.hasError('notUnique')">
              位置编码已存在
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>名称 *</mat-label>
            <input matInput formControlName="name" placeholder="如：A区一号笼架一层" maxlength="100" />
            <mat-error *ngIf="form.get('name')?.hasError('required')">
              请输入名称
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>所在区域</mat-label>
            <input matInput formControlName="area" placeholder="如：动物房A区" maxlength="50" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>笼架号</mat-label>
            <input matInput formControlName="rackNumber" placeholder="如：R01" maxlength="20" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>层级</mat-label>
            <input matInput type="number" formControlName="shelfLevel" placeholder="如：1" min="1" max="20" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>最大容量 *</mat-label>
            <input matInput type="number" formControlName="maxCapacity" placeholder="如：20" min="1" />
            <mat-error *ngIf="form.get('maxCapacity')?.hasError('required')">
              请输入最大容量
            </mat-error>
            <mat-error *ngIf="form.get('maxCapacity')?.hasError('min')">
              容量必须大于 0
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>允许物种</mat-label>
            <input matInput formControlName="speciesAllowed" placeholder="如：小鼠/大鼠/兔" maxlength="100" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>备注</mat-label>
            <textarea matInput formControlName="notes" rows="3" placeholder="可选，填写其他说明信息" maxlength="500"></textarea>
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
        <mat-icon *ngIf="!isSubmitting">{{ isEdit ? 'save' : 'add' }}</mat-icon>
        <mat-icon *ngIf="isSubmitting" class="spinner">sync</mat-icon>
        {{ isSubmitting ? '保存中...' : (isEdit ? '保存' : '创建') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { padding-top: 16px; min-width: 500px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 8px; }
    .form-row > mat-form-field { flex: 1; }
    .full-width { flex: 1; }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
  `]
})
export class CageLocationDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CageLocationDialogComponent>);
  private cageLocationService = inject(CageLocationService);
  private snackBar = inject(MatSnackBar);
  private data: CageLocation | null = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  isEdit = false;
  isSubmitting = false;

  ngOnInit(): void {
    this.isEdit = !!this.data;
    this.buildForm();
  }

  buildForm(): void {
    this.form = this.fb.group({
      locationCode: [
        { value: this.data?.cageNumber || '', disabled: this.isEdit },
        [Validators.required]
      ],
      name: [this.data?.locationDescription || '', Validators.required],
      area: [this.data?.roomNumber || ''],
      rackNumber: [(this.data as any)?.rackNumber || ''],
      shelfLevel: [(this.data as any)?.shelfLevel || null],
      maxCapacity: [
        this.data?.maxCapacity || null,
        [Validators.required, Validators.min(1)]
      ],
      speciesAllowed: [this.data?.speciesAllowed || ''],
      notes: [''],
    });
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    this.isSubmitting = true;

    const formValue = this.form.getRawValue();

    if (this.isEdit && this.data) {
      const dto: CageLocationUpdateDto = {
        roomNumber: formValue.area,
        cageNumber: formValue.locationCode,
        locationDescription: formValue.name,
        maxCapacity: Number(formValue.maxCapacity),
        status: this.data.status,
        speciesAllowed: formValue.speciesAllowed,
      };
      this.cageLocationService.update(this.data.id, dto).subscribe({
        next: (res) => this.handleResponse(res),
        error: (e) => this.handleError(e),
      });
    } else {
      const dto: CageLocationCreateDto = {
        roomNumber: formValue.area,
        cageNumber: formValue.locationCode,
        locationDescription: formValue.name,
        maxCapacity: Number(formValue.maxCapacity),
        speciesAllowed: formValue.speciesAllowed || '通用',
      };
      this.cageLocationService.create(dto).subscribe({
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
