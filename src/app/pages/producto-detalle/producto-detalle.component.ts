import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService, Producto } from '../../services/profile.service';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-detalle.component.html',
  styleUrl: './producto-detalle.component.scss'
})
export class ProductoDetalleComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  producto = signal<Producto | null>(null);
  loading = signal(true);
  notFound = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.router.navigate(['/home']);
      return;
    }

    await this.cargarProducto(parseInt(id));
  }

  async cargarProducto(id: number) {
    this.loading.set(true);
    const producto = await this.profileService.getProductoById(id);
    
    if (producto) {
      this.producto.set(producto);
      this.notFound.set(false);
    } else {
      this.notFound.set(true);
    }
    
    this.loading.set(false);
  }

  volver() {
    this.router.navigate(['/home']);
  }

  async logout() {
    await this.authService.signOut();
  }

  get userName(): string {
    const user = this.authService.currentUser();
    return user?.user_metadata?.['fullName'] || user?.email || 'Usuario';
  }

  get disponibilidadTexto(): string {
    const cantidad = this.producto()?.cantidad || 0;
    if (cantidad === 0) return 'Agotado';
    if (cantidad < 5) return `Pocas unidades (${cantidad})`;
    return `En stock (${cantidad} unidades)`;
  }

  get disponibilidadClass(): string {
    const cantidad = this.producto()?.cantidad || 0;
    if (cantidad === 0) return 'out';
    if (cantidad < 5) return 'low';
    return 'available';
  }
}

