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

  // Propiedades para manejo de imagen
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  // Propiedades para alertas y estado de envío
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;
  isSubmitting: boolean = false;

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

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.alertMessage = 'Por favor selecciona una imagen válida (PNG, JPG, JPEG)';
        this.alertType = 'error';
        setTimeout(() => this.alertMessage = null, 3000);
        return;
      }

      // Validar tamaño (máx. 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.alertMessage = 'La imagen no puede superar los 5MB';
        this.alertType = 'error';
        setTimeout(() => this.alertMessage = null, 3000);
        return;
      }

      this.selectedImage = file;

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  async onSubmit() {
    if (this.productoForm.valid) {
      this.isSubmitting = true;
      this.alertMessage = null;

      try {
        const result = await this.profileService.createProducto(
          this.productoForm.value,
          this.selectedImage || undefined
        );

        if (result.success) {
          this.alertMessage = 'Producto creado exitosamente';
          this.alertType = 'success';
          this.productoForm.reset();
          this.removeImage();
          setTimeout(() => this.alertMessage = null, 3000);
        } else {
          this.alertMessage = result.error || 'Error al crear producto';
          this.alertType = 'error';
        }
      } catch (error) {
        console.error('Error:', error);
        this.alertMessage = 'Error inesperado al crear producto';
        this.alertType = 'error';
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.alertMessage = 'Por favor completa todos los campos correctamente';
      this.alertType = 'error';
      setTimeout(() => this.alertMessage = null, 3000);
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
