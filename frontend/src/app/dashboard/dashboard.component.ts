import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats = [
    { title: '课题组数量', value: 12, icon: 'groups', color: '#1976d2' },
    { title: '进行中批次', value: 8, icon: 'science', color: '#388e3c' },
    { title: '有效批件', value: 25, icon: 'verified', color: '#f57c00' },
    { title: '在用笼位', value: 320, icon: 'meeting_room', color: '#7b1fa2' },
    { title: '异常死亡待调查', value: 3, icon: 'warning', color: '#d32f2f' }
  ];

  recentOrdersColumns = ['orderNo', 'researchGroup', 'species', 'quantity', 'status', 'createTime'];
  recentOrdersData = [
    { orderNo: 'ORD202606001', researchGroup: '神经科学课题组', species: '小鼠/C57BL/6', quantity: 50, status: '审批中', createTime: '2026-06-18' },
    { orderNo: 'ORD202606002', researchGroup: '肿瘤生物学组', species: '大鼠/SD', quantity: 30, status: '运输中', createTime: '2026-06-17' },
    { orderNo: 'ORD202606003', researchGroup: '免疫学实验室', species: '小鼠/BALB/c', quantity: 80, status: '已接收', createTime: '2026-06-15' },
    { orderNo: 'ORD202606004', researchGroup: '心血管研究组', species: '兔/新西兰兔', quantity: 12, status: '待提交', createTime: '2026-06-14' },
    { orderNo: 'ORD202606005', researchGroup: '代谢疾病组', species: '小鼠/KM', quantity: 100, status: '已完成', createTime: '2026-06-12' }
  ];

  recentBatchesColumns = ['batchNo', 'researchGroup', 'species', 'totalQty', 'startDate', 'status'];
  recentBatchesData = [
    { batchNo: 'BAT202606001', researchGroup: '神经科学课题组', species: '小鼠/C57BL/6', totalQty: 60, startDate: '2026-06-10', status: '进行中' },
    { batchNo: 'BAT202606002', researchGroup: '肿瘤生物学组', species: '大鼠/SD', totalQty: 40, startDate: '2026-06-08', status: '进行中' },
    { batchNo: 'BAT202605003', researchGroup: '免疫学实验室', species: '小鼠/BALB/c', totalQty: 100, startDate: '2026-05-28', status: '进行中' },
    { batchNo: 'BAT202605002', researchGroup: '心血管研究组', species: '小鼠/C57BL/6', totalQty: 50, startDate: '2026-05-20', status: '已结束' }
  ];

  ngOnInit(): void {}

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      '审批中': 'accent',
      '运输中': 'accent',
      '已接收': 'primary',
      '待提交': '',
      '已完成': 'primary',
      '进行中': 'primary',
      '已结束': ''
    };
    return map[status] || '';
  }
}
