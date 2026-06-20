import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ResearchGroupService } from '../../core/services/research-group.service';
import { ResearchGroup, PagedQueryParams } from '../../core/models';
import { ResearchGroupDialogComponent } from './research-group-dialog.component';

@Component({
  selector: 'app-research-group-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './research-group-list.component.html',
  styleUrls: ['./research-group-list.component.scss']
})
export class ResearchGroupListComponent implements OnInit {
  displayedColumns: string[] = ['code', 'name', 'principalInvestigator', 'contactPhone', 'projectCount', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<ResearchGroup>();
  totalCount = 0;
  isLoading = false;

  searchControl = new FormControl('');
  pageIndex = 0;
  pageSize = 10;
  sortField = 'createdAt';
  sortDirection = 'desc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private researchGroupService: ResearchGroupService,
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
      sortField: this.sortField,
      sortDirection: this.sortDirection,
      searchKeyword: this.searchControl.value || ''
    };

    this.researchGroupService.getPaged(params).subscribe({
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

  onSortChange(sort: Sort): void {
    this.sortField = sort.active;
    this.sortDirection = sort.direction || 'desc';
    this.loadData();
  }

  openDialog(data?: ResearchGroup): void {
    const dialogRef = this.dialog.open(ResearchGroupDialogComponent, {
      width: '600px',
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

  onDelete(row: ResearchGroup): void {
    const snackBarRef = this.snackBar.open(
      `确定删除课题组"${row.name}"吗？`,
      '删除',
      { duration: 5000, panelClass: 'warning-snackbar' }
    );

    snackBarRef.onAction().subscribe(() => {
      this.researchGroupService.delete(row.id).subscribe({
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

  getProjectCount(row: ResearchGroup): number {
    return 0;
  }
}
