import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EthicsApprovalService } from '../../core/services/ethics-approval.service';
import { EthicsApproval, EthicsApprovalStatus, PagedQueryParams } from '../../core/models';
import { EthicsApprovalDialogComponent } from './ethics-approval-dialog.component';

@Component({
  selector: 'app-ethics-approval-list',
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
    MatTooltipModule,
    MatBadgeModule,
    MatChipsModule
  ],
  templateUrl: './ethics-approval-list.component.html',
  styleUrls: ['./ethics-approval-list.component.scss']
})
export class EthicsApprovalListComponent implements OnInit {
  displayedColumns: string[] = [
    'approvalNumber', 'title', 'researchGroup', 'approvalDate',
    'effectiveDate', 'expiryDate', 'status', 'usage', 'actions'
  ];
  dataSource = new MatTableDataSource<EthicsApproval>();
  totalCount = 0;
  isLoading = false;

  searchControl = new FormControl('');
  pageIndex = 0;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ethicsApprovalService: EthicsApprovalService,
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

    this.ethicsApprovalService.getPaged(params).subscribe({
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

  isExpired(row: EthicsApproval): boolean {
    return row.status === EthicsApprovalStatus.Expired ||
      new Date(row.expiryDate) < new Date();
  }

  getStatusText(status: EthicsApprovalStatus): string {
    const map: Record<EthicsApprovalStatus, string> = {
      [EthicsApprovalStatus.Draft]: '草稿',
      [EthicsApprovalStatus.Submitted]: '已提交',
      [EthicsApprovalStatus.Approved]: '已批准',
      [EthicsApprovalStatus.Rejected]: '已拒绝',
      [EthicsApprovalStatus.Expired]: '已过期'
    };
    return map[status] || '未知';
  }

  getStatusClass(row: EthicsApproval): string {
    if (this.isExpired(row)) {
      return 'status-expired';
    }
    switch (row.status) {
      case EthicsApprovalStatus.Approved:
        return 'status-approved';
      case EthicsApprovalStatus.Submitted:
        return 'status-submitted';
      case EthicsApprovalStatus.Rejected:
        return 'status-rejected';
      default:
        return 'status-draft';
    }
  }

  openDialog(data?: EthicsApproval): void {
    const dialogRef = this.dialog.open(EthicsApprovalDialogComponent, {
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

  onViewDetail(row: EthicsApproval): void {
    this.dialog.open(EthicsApprovalDialogComponent, {
      width: '700px',
      data: { ...row, isViewOnly: true }
    });
  }

  onDelete(row: EthicsApproval): void {
    const snackBarRef = this.snackBar.open(
      `确定删除批件"${row.approvalNumber}"吗？`,
      '删除',
      { duration: 5000 }
    );

    snackBarRef.onAction().subscribe(() => {
      this.ethicsApprovalService.delete(row.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('删除成功', '关闭', { duration: 3000 });
            this.loadData();
          } else {
            this.snackBar.open(res.message || '删除失败', '关闭', { duration: 3000 });
          }
        },
        error: () => {
          this.snackBar.open('删除失败', '关闭', { duration: 3000 });
        }
      });
    });
  }
}
