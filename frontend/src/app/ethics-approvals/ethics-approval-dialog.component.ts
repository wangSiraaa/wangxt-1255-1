import { Component, Inject, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, map, startWith } from 'rxjs';
import { FormControl } from '@angular/forms';
import { EthicsApprovalService } from '../../core/services/ethics-approval.service';
import { ResearchGroupService } from '../../core/services/research-group.service';
import {
  EthicsApproval,
  EthicsApprovalCreateDto,
  EthicsApprovalUpdateDto,
  EthicsApprovalStatus,
  ResearchGroup
} from '../../core/models';

@Component({
  selector: 'app-ethics-approval-dialog',
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
    MatSnackBarModule
  ],
  templateUrl: './ethics-approval-dialog.component.html',
  styleUrls: ['./ethics-approval-dialog.component.scss']
})
export class EthicsApprovalDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  isViewOnly = false;
  isSubmitting = false;

  researchGroups: ResearchGroup[] = [];
  filteredGroups$!: Observable<ResearchGroup[]>;
  groupSearchControl = new FormControl('');

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EthicsApprovalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EthicsApproval & { isViewOnly?: boolean } | null,
    private ethicsApprovalService: EthicsApprovalService,
    private researchGroupService: ResearchGroupService,
    private snackBar: MatSnackBar
  ) {
    this.isEdit = !!data && !data.isViewOnly;
    this.isViewOnly = !!data?.isViewOnly;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      researchGroupId: [this.data?.researchGroupId || '', [Validators.required]],
      approvalNumber: [this.data?.approvalNumber || '', [Validators.required]],
      title: [this.data?.title || '', [Validators.required]],
      approvalDate: [this.data?.approvalDate ? new Date(this.data.approvalDate) : '', [Validators.required]],
      effectiveDate: [this.data?.approvalDate ? new Date(this.data.approvalDate) : '', [Validators.required]],
      expiryDate: [this.data?.expiryDate ? new Date(this.data.expiryDate) : '', [Validators.required]],
      animalTypes: [this.data?.animalTypes || ''],
      maximumAnimals: [this.data?.maxAnimalCount || null, [Validators.required, Validators.min(1)]],
      remarks: [this.data?.remarks || '']
    }, {
      validators: [this.dateRangeValidator, this.effectiveDateValidator]
    });

    if (this.isViewOnly) {
      this.form.disable();
    }

    this.loadResearchGroups();

    this.filteredGroups$ = this.groupSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterGroups(value || ''))
    );
  }

  private filterGroups(keyword: string): ResearchGroup[] {
    const kw = keyword.toLowerCase();
    return this.researchGroups.filter(g =>
      g.name.toLowerCase().includes(kw) ||
      g.code.toLowerCase().includes(kw) ||
      g.principalInvestigator.toLowerCase().includes(kw)
    );
  }

  loadResearchGroups(): void {
    this.researchGroupService.getPaged({
      pageIndex: 0,
      pageSize: 9999,
      sortField: 'name',
      sortDirection: 'asc',
      searchKeyword: ''
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.researchGroups = res.data.items;
        }
      }
    });
  }

  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const effective = group.get('effectiveDate')?.value;
    const expiry = group.get('expiryDate')?.value;
    if (effective && expiry && new Date(effective) >= new Date(expiry)) {
      return { dateRange: '生效日期必须早于到期日期' };
    }
    return null;
  }

  effectiveDateValidator(group: AbstractControl): ValidationErrors | null {
    const approval = group.get('approvalDate')?.value;
    const effective = group.get('effectiveDate')?.value;
    if (approval && effective && new Date(effective) < new Date(approval)) {
      return { effectiveBeforeApproval: '生效日期不能早于审批日期' };
    }
    return null;
  }

  get f() {
    return this.form.controls;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.errors?.['dateRange']) {
        this.snackBar.open('生效日期必须早于到期日期', '关闭', { duration: 3000 });
      }
      if (this.form.errors?.['effectiveBeforeApproval']) {
        this.snackBar.open('生效日期不能早于审批日期', '关闭', { duration: 3000 });
      }
      return;
    }

    this.isSubmitting = true;
    const val = this.form.value;

    if (this.isEdit && this.data) {
      const dto: EthicsApprovalUpdateDto = {
        researchGroupId: val.researchGroupId,
        approvalNumber: val.approvalNumber,
        title: val.title,
        approvalDate: val.approvalDate,
        expiryDate: val.expiryDate,
        animalTypes: val.animalTypes,
        maxAnimalCount: val.maximumAnimals,
        status: this.data.status,
        remarks: val.remarks
      };

      this.ethicsApprovalService.update(this.data.id, dto).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(res.message || '更新失败', '关闭', { duration: 3000 });
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.snackBar.open('更新失败', '关闭', { duration: 3000 });
        }
      });
    } else {
      const dto: EthicsApprovalCreateDto = {
        researchGroupId: val.researchGroupId,
        approvalNumber: val.approvalNumber,
        title: val.title,
        approvalDate: val.approvalDate,
        expiryDate: val.expiryDate,
        animalTypes: val.animalTypes,
        maxAnimalCount: val.maximumAnimals,
        remarks: val.remarks
      };

      this.ethicsApprovalService.create(dto).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(res.message || '创建失败', '关闭', { duration: 3000 });
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.snackBar.open('创建失败', '关闭', { duration: 3000 });
        }
      });
    }
  }
}
