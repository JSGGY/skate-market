import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-vendedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vendedor.component.html',
  styleUrl: './vendedor.component.scss'
})
export class VendedorComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  productoForm: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  tiposProducto = [
    'Tabla',
    'Ruedas',
    'Trucks',
    'Rodamientos',
    'Camiseta',
    'Sudadera',
    'Pantalón',
    'Zapatillas',
    'Gorra',
    'Mochila',
    'Otro'
  ];

  constructor() {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      publicado: [false]
    });
  }

  async onSubmit() {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const user = this.authService.currentUser();
    if (!user) {
      this.errorMessage.set('No hay usuario autenticado');
      this.loading.set(false);
      return;
    }

    const producto = {
      ...this.productoForm.value,
      vendedor_id: user.id
    };

    try {
      const result = await this.profileService.createProducto(producto);
      
      if (result.success) {
        this.successMessage.set('¡Producto publicado exitosamente!');
        this.productoForm.reset({
          cantidad: 1,
          precio: 0,
          publicado: false
        });
      } else {
        this.errorMessage.set(result.error || 'Error al publicar producto');
      }
    } catch (error) {
      this.errorMessage.set('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async logout() {
    await this.authService.signOut();
  }

  get nombre() {
    return this.productoForm.get('nombre');
  }

  get tipo() {
    return this.productoForm.get('tipo');
  }

  get cantidad() {
    return this.productoForm.get('cantidad');
  }

  get descripcion() {
    return this.productoForm.get('descripcion');
  }

  get precio() {
    return this.productoForm.get('precio');
  }

  get userName(): string {
    const user = this.authService.currentUser();
    return user?.user_metadata?.['fullName'] || user?.email || 'Admin';
  }
}

