import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que protege rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que se complete la inicialización
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Guardar la URL intentada para redirigir después del login
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};

/**
 * Guard que redirige a home si el usuario ya está autenticado
 * Útil para páginas de login/register
 */
export const guestGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que se complete la inicialización
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Usuario ya autenticado, redirigir a home
  router.navigate(['/home']);
  return false;
};

