import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  registerForm: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor() {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword.set(!this.showPassword());
    } else {
      this.showConfirmPassword.set(!this.showConfirmPassword());
    }
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { fullName, email, password } = this.registerForm.value;

    try {
      const result = await this.authService.signUp(email, password, { fullName });
      
      if (result.success && result.user) {
        // Crear perfil en la tabla perfiles
        await this.profileService.createProfile(result.user.id, fullName);
        
        this.successMessage.set('¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu cuenta.');
        this.registerForm.reset();
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      } else {
        this.errorMessage.set(result.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      this.errorMessage.set('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  get fullName() {
    return this.registerForm.get('fullName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get passwordMismatch() {
    return this.registerForm.errors?.['passwordMismatch'] && 
           this.confirmPassword?.touched;
  }
}

