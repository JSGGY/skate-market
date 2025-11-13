import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    try {
      const result = await this.authService.signIn(email, password);
      
      if (result.success && result.user) {
        console.log('✅ Login exitoso, usuario:', result.user.id);
        
        // Obtener el perfil del usuario
        const profile = await this.profileService.getProfile(result.user.id);
        
        console.log('📋 Perfil obtenido:', profile);
        
        if (profile) {
          // Redirigir según el rol
          console.log('🔑 Rol del usuario:', profile.rol);
          
          if (profile.rol === 'admin') {
            console.log('👨‍💼 Redirigiendo a /vendedor');
            this.router.navigate(['/vendedor']);
          } else {
            console.log('👤 Redirigiendo a /home');
            this.router.navigate(['/home']);
          }
        } else {
          console.warn('⚠️ No se encontró perfil, redirigiendo a /home');
          this.router.navigate(['/home']);
        }
      } else {
        this.errorMessage.set(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      this.errorMessage.set('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

