import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workspace/asset-workspace.component').then((m) => m.AssetWorkspaceComponent),
    title: 'GIS Asset Manager',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Sign In · GIS Asset Manager',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
    title: 'Create Account · GIS Asset Manager',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
