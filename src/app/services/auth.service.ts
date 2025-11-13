import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User, AuthError } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase!: SupabaseClient;
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  
  // Signals para reactive state
  public currentUser = signal<User | null>(null);
  public isAuthenticated = signal<boolean>(false);
  public loading = signal<boolean>(true);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Solo inicializar Supabase en el navegador
    if (this.isBrowser) {
      this.supabase = createClient(
        environment.supabase.url,
        environment.supabase.anonKey
      );
      this.initializeAuth();
    } else {
      // En el servidor, marcar como no cargando
      this.loading.set(false);
    }
  }

  /**
   * Inicializa el estado de autenticación
   */
  private async initializeAuth() {
    if (!this.isBrowser) {
      return;
    }

    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session?.user) {
        this.currentUser.set(session.user);
        this.isAuthenticated.set(true);
      }
      
      // Suscribirse a cambios de autenticación
      this.supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.currentUser.set(session.user);
          this.isAuthenticated.set(true);
        } else {
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
        }
      });
    } catch (error) {
      console.error('Error al inicializar autenticación:', error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async signUp(email: string, password: string, metadata?: { fullName?: string }): Promise<AuthResponse> {
    if (!this.isBrowser) {
      return { success: false, error: 'Operación no disponible en el servidor' };
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        return { success: false, error: this.getErrorMessage(error) };
      }

      if (data.user) {
        return { 
          success: true, 
          user: data.user,
          error: data.user.identities?.length === 0 
            ? 'Este correo ya está registrado' 
            : undefined
        };
      }

      return { success: false, error: 'Error desconocido al registrar' };
    } catch (error) {
      return { success: false, error: 'Error al registrar usuario' };
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!this.isBrowser) {
      return { success: false, error: 'Operación no disponible en el servidor' };
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: this.getErrorMessage(error) };
      }

      if (data.user) {
        // No redirigir aquí, el componente de login se encargará
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Error desconocido al iniciar sesión' };
    } catch (error) {
      return { success: false, error: 'Error al iniciar sesión' };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async signOut(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      await this.supabase.auth.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  /**
   * Envía un email de recuperación de contraseña
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    if (!this.isBrowser) {
      return { success: false, error: 'Operación no disponible en el servidor' };
    }

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: this.getErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al enviar email de recuperación' };
    }
  }

  /**
   * Actualiza la contraseña del usuario
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    if (!this.isBrowser) {
      return { success: false, error: 'Operación no disponible en el servidor' };
    }

    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: this.getErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al actualizar contraseña' };
    }
  }

  /**
   * Obtiene el usuario actual
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }

  /**
   * Traduce los errores de Supabase al español
   */
  private getErrorMessage(error: AuthError): string {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Credenciales incorrectas',
      'Email not confirmed': 'Email no confirmado',
      'User already registered': 'El usuario ya está registrado',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
      'Invalid email': 'Email inválido',
      'User not found': 'Usuario no encontrado',
      'Signups not allowed for this instance': 'Los registros están deshabilitados'
    };

    return errorMessages[error.message] || error.message || 'Error desconocido';
  }
}

