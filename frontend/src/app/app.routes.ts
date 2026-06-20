import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'research-groups',
    children: [
      {
        path: '',
        loadComponent: () => import('./research-groups/research-group-list/research-group-list.component').then(m => m.ResearchGroupListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./research-groups/research-group-detail/research-group-detail.component').then(m => m.ResearchGroupDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./research-groups/research-group-edit/research-group-edit.component').then(m => m.ResearchGroupEditComponent)
      }
    ]
  },
  {
    path: 'ethics-approvals',
    loadComponent: () => import('./ethics-approvals/ethics-approval-list/ethics-approval-list.component').then(m => m.EthicsApprovalListComponent)
  },
  {
    path: 'animal-orders',
    loadComponent: () => import('./animal-orders/animal-order-list/animal-order-list.component').then(m => m.AnimalOrderListComponent)
  },
  {
    path: 'animal-batches',
    loadComponent: () => import('./animal-batches/animal-batch-list/animal-batch-list.component').then(m => m.AnimalBatchListComponent)
  },
  {
    path: 'cage-locations',
    loadComponent: () => import('./cage-locations/cage-location-list/cage-location-list.component').then(m => m.CageLocationListComponent)
  },
  {
    path: 'cage-allocations',
    loadComponent: () => import('./cage-allocations/cage-allocation-list/cage-allocation-list.component').then(m => m.CageAllocationListComponent)
  },
  {
    path: 'quarantine',
    loadComponent: () => import('./quarantine/quarantine-list/quarantine-list.component').then(m => m.QuarantineListComponent)
  },
  {
    path: 'death-records',
    loadComponent: () => import('./death-records/death-record-list/death-record-list.component').then(m => m.DeathRecordListComponent)
  },
  {
    path: 'death-investigations',
    loadComponent: () => import('./death-investigations/death-investigation-list/death-investigation-list.component').then(m => m.DeathInvestigationListComponent)
  }
];
