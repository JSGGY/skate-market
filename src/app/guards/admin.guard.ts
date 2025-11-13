import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

/**
 * Guard que protege rutas que requieren rol de admin
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const profileService = inject(ProfileService);
  const router = inject(Router);

  // Esperar a que se complete la inicialización
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const user = authService.currentUser();
  
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // Obtener perfil si no está cargado
  let profile = profileService.currentProfile();
  if (!profile) {
    profile = await profileService.getProfile(user.id);
  }

  if (profile?.rol === 'admin') {
    return true;
  }

  // No es admin, redirigir a home
  router.navigate(['/home']);
  return false;
};

