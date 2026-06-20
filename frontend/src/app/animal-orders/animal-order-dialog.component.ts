import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AnimalOrderService } from '../../core/services/animal-order.service';
import { EthicsApprovalService } from '../../core/services/ethics-approval.service';
import { ResearchGroupService } from '../../core/services/research-group.service';
import {
  AnimalOrder,
  AnimalOrderCreateDto,
  AnimalOrderUpdateDto,
  Gender,
  ResearchGroup,
  EthicsApproval,
  OrderStatus
} from '../../core/models';

@Component({
  selector: 'app-animal-order-dialog',
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
  templateUrl: './animal-order-dialog.component.html',
  styleUrls: ['./animal-order-dialog.component.scss']
})
export class AnimalOrderDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  isViewOnly = false;
  isSubmitting = false;

  researchGroups: ResearchGroup[] = [];
  ethicsApprovals: EthicsApproval[] = [];
  filteredApprovals: EthicsApproval[] = [];

  genderOptions = [
    { value: Gender.Male, label: '雄性' },
    { value: Gender.Female, label: '雌性' },
    { value: Gender.Unknown, label: '不限/未知' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AnimalOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AnimalOrder & { isViewOnly?: boolean } | null,
    private animalOrderService: AnimalOrderService,
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
      ethicsApprovalId: [this.data?.ethicsApprovalId || '', [Validators.required]],
      species: [this.data?.species || '', [Validators.required]],
      strain: [this.data?.strain || '', [Validators.required]],
      gender: [this.data?.gender ?? Gender.Unknown, [Validators.required]],
      ageWeeks: [this.data?.ageWeeks || null, [Validators.required, Validators.min(0)]],
      quantity: [this.data?.quantity || null, [Validators.required, Validators.min(1)]],
      supplier: [this.data?.supplier || '', [Validators.required]],
      expectedDate: [this.data?.expectedArrivalDate ? new Date(this.data.expectedArrivalDate) : ''],
      remarks: [this.data?.remarks || '']
    });

    if (this.isViewOnly) {
      this.form.disable();
    }

    this.loadResearchGroups();
    this.loadEthicsApprovals();

    this.form.get('researchGroupId')?.valueChanges.subscribe(id => {
      this.filterApprovals(id);
      const current = this.form.get('ethicsApprovalId')?.value;
      const stillExists = this.filteredApprovals.some(a => a.id === current);
      if (!stillExists) {
        this.form.get('ethicsApprovalId')?.setValue('');
      }
    });
  }

  loadResearchGroups(): void {
    this.researchGroupService.getPaged({
      pageIndex: 0,
      pageSize: 9999,
      sortField: 'name',
      sortDirection: 'asc',
      searchKeyword: ''
    }).subscribe(res => {
      if (res.success && res.data) {
        this.researchGroups = res.data.items;
      }
    });
  }

  loadEthicsApprovals(): void {
    const rgId = this.data?.researchGroupId;
    if (rgId) {
      this.ethicsApprovalService.getByResearchGroup(rgId).subscribe(res => {
        if (res.success && res.data) {
          this.ethicsApprovals = res.data;
          this.filterApprovals(rgId);
        }
      });
    } else {
      this.ethicsApprovalService.getPaged({
        pageIndex: 0, pageSize: 9999, sortField: 'approvalNumber',
        sortDirection: 'asc', searchKeyword: ''
      }).subscribe(res => {
        if (res.success && res.data) {
          this.ethicsApprovals = res.data.items;
          this.filteredApprovals = res.data.items.filter(a => a.isValid);
        }
      });
    }
  }

  filterApprovals(researchGroupId: string): void {
    this.filteredApprovals = this.ethicsApprovals.filter(a =>
      a.researchGroupId === researchGroupId && a.isValid
    );
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
      return;
    }

    this.isSubmitting = true;
    const val = this.form.value;

    if (this.isEdit && this.data) {
      const dto: AnimalOrderUpdateDto = {
        researchGroupId: val.researchGroupId,
        ethicsApprovalId: val.ethicsApprovalId,
        species: val.species,
        strain: val.strain,
        gender: val.gender,
        ageWeeks: val.ageWeeks,
        quantity: val.quantity,
        supplier: val.supplier,
        unitPrice: this.data.unitPrice || 0,
        expectedArrivalDate: val.expectedDate,
        remarks: val.remarks
      };

      this.animalOrderService.update(this.data.id, dto).subscribe({
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
      const dto: AnimalOrderCreateDto = {
        researchGroupId: val.researchGroupId,
        ethicsApprovalId: val.ethicsApprovalId,
        species: val.species,
        strain: val.strain,
        gender: val.gender,
        ageWeeks: val.ageWeeks,
        quantity: val.quantity,
        supplier: val.supplier,
        unitPrice: 0,
        expectedArrivalDate: val.expectedDate || new Date(),
        remarks: val.remarks
      };

      this.animalOrderService.create(dto).subscribe({
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

  onSubmitAndSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const val = this.form.value;

    const dto: AnimalOrderCreateDto = {
      researchGroupId: val.researchGroupId,
      ethicsApprovalId: val.ethicsApprovalId,
      species: val.species,
      strain: val.strain,
      gender: val.gender,
      ageWeeks: val.ageWeeks,
      quantity: val.quantity,
      supplier: val.supplier,
      unitPrice: 0,
      expectedArrivalDate: val.expectedDate || new Date(),
      remarks: val.remarks
    };

    this.animalOrderService.create(dto).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.animalOrderService.submit(res.data.id).subscribe({
            next: (submitRes) => {
              this.isSubmitting = false;
              if (submitRes.success) {
                this.dialogRef.close(true);
                this.snackBar.open('创建并提交成功', '关闭', { duration: 3000 });
              }
            },
            error: () => {
              this.isSubmitting = false;
              this.dialogRef.close(true);
              this.snackBar.open('创建成功，提交失败请手动提交', '关闭', { duration: 4000 });
            }
          });
        } else {
          this.isSubmitting = false;
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
