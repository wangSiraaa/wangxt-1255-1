import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ResearchGroupService } from '../../core/services/research-group.service';
import { ResearchGroup, ResearchGroupCreateDto, ResearchGroupUpdateDto } from '../../core/models';

@Component({
  selector: 'app-research-group-dialog',
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
  templateUrl: './research-group-dialog.component.html',
  styleUrls: ['./research-group-dialog.component.scss']
})
export class ResearchGroupDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ResearchGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResearchGroup | null,
    private researchGroupService: ResearchGroupService
  ) {
    this.isEdit = !!data;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      groupCode: [this.data?.code || '', [Validators.required]],
      name: [this.data?.name || '', [Validators.required]],
      principalInvestigator: [this.data?.principalInvestigator || '', [Validators.required]],
      contactPhone: [this.data?.contactPhone || ''],
      contactEmail: [this.data?.contactEmail || ''],
      department: [this.data?.department || ''],
      remarks: [this.data?.description || '']
    });
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
    const formValue = this.form.value;

    if (this.isEdit && this.data) {
      const dto: ResearchGroupUpdateDto = {
        code: formValue.groupCode,
        name: formValue.name,
        principalInvestigator: formValue.principalInvestigator,
        contactPhone: formValue.contactPhone,
        contactEmail: formValue.contactEmail,
        department: formValue.department,
        description: formValue.remarks
      };

      this.researchGroupService.update(this.data.id, dto).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.dialogRef.close(true);
          }
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      const dto: ResearchGroupCreateDto = {
        code: formValue.groupCode,
        name: formValue.name,
        principalInvestigator: formValue.principalInvestigator,
        contactPhone: formValue.contactPhone,
        contactEmail: formValue.contactEmail,
        department: formValue.department,
        description: formValue.remarks
      };

      this.researchGroupService.create(dto).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.dialogRef.close(true);
          }
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    }
  }
}
