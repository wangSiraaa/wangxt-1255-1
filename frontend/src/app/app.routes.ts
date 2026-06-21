import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'research-groups',
    loadComponent: () => import('./research-groups/research-group-list.component').then(m => m.ResearchGroupListComponent)
  },
  {
    path: 'ethics-approvals',
    loadComponent: () => import('./ethics-approvals/ethics-approval-list.component').then(m => m.EthicsApprovalListComponent)
  },
  {
    path: 'animal-orders',
    loadComponent: () => import('./animal-orders/animal-order-list.component').then(m => m.AnimalOrderListComponent)
  },
  {
    path: 'animal-batches',
    loadComponent: () => import('./animal-batches/animal-batch-list.component').then(m => m.AnimalBatchListComponent)
  },
  {
    path: 'cage-locations',
    loadComponent: () => import('./cage-locations/cage-location-list.component').then(m => m.CageLocationListComponent)
  },
  {
    path: 'cage-allocations',
    loadComponent: () => import('./cage-allocations/cage-allocation-list.component').then(m => m.CageAllocationListComponent)
  },
  {
    path: 'quarantine',
    loadComponent: () => import('./quarantine/quarantine-list.component').then(m => m.QuarantineListComponent)
  },
  {
    path: 'death-records',
    loadComponent: () => import('./death-records/death-record-list.component').then(m => m.DeathRecordListComponent)
  },
  {
    path: 'death-investigations',
    loadComponent: () => import('./death-investigations/death-investigation-list.component').then(m => m.DeathInvestigationListComponent)
  }
];
