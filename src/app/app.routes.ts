import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'vendedor',
    loadComponent: () => import('./pages/vendedor/vendedor.component').then(m => m.VendedorComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/producto-detalle/producto-detalle.component').then(m => m.ProductoDetalleComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
