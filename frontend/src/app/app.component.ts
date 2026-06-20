import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" mode="over">
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>仪表板</span>
          </a>
          <a mat-list-item routerLink="/research-groups" routerLinkActive="active">
            <mat-icon matListItemIcon>groups</mat-icon>
            <span matListItemTitle>课题组</span>
          </a>
          <a mat-list-item routerLink="/ethics-approvals" routerLinkActive="active">
            <mat-icon matListItemIcon>verified</mat-icon>
            <span matListItemTitle>伦理批件</span>
          </a>
          <a mat-list-item routerLink="/animal-orders" routerLinkActive="active">
            <mat-icon matListItemIcon>shopping_cart</mat-icon>
            <span matListItemTitle>动物订购</span>
          </a>
          <a mat-list-item routerLink="/animal-batches" routerLinkActive="active">
            <mat-icon matListItemIcon>inventory_2</mat-icon>
            <span matListItemTitle>动物批次</span>
          </a>
          <a mat-list-item routerLink="/cage-locations" routerLinkActive="active">
            <mat-icon matListItemIcon>location_on</mat-icon>
            <span matListItemTitle>笼位管理</span>
          </a>
          <a mat-list-item routerLink="/cage-allocations" routerLinkActive="active">
            <mat-icon matListItemIcon>app_registration</mat-icon>
            <span matListItemTitle>笼位分配</span>
          </a>
          <a mat-list-item routerLink="/quarantine" routerLinkActive="active">
            <mat-icon matListItemIcon>health_and_safety</mat-icon>
            <span matListItemTitle>检疫管理</span>
          </a>
          <a mat-list-item routerLink="/death-records" routerLinkActive="active">
            <mat-icon matListItemIcon>report</mat-icon>
            <span matListItemTitle>死亡记录</span>
          </a>
          <a mat-list-item routerLink="/death-investigations" routerLinkActive="active">
            <mat-icon matListItemIcon>search</mat-icon>
            <span matListItemTitle>死亡调查</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <button mat-icon-button (click)="drawer.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">实验动物管理系统</span>
        </mat-toolbar>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
}
