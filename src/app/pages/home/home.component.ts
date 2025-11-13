import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService, Producto } from '../../services/profile.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  async ngOnInit() {
    await this.cargarProductos();
  }

  async cargarProductos() {
    this.loading.set(true);
    const productos = await this.profileService.getProductos();
    this.productos.set(productos);
    this.productosFiltrados.set(productos);
    this.loading.set(false);
  }

  buscarProductos(term: string) {
    this.searchTerm.set(term);
    const termLower = term.toLowerCase().trim();
    
    if (!termLower) {
      this.productosFiltrados.set(this.productos());
      return;
    }

    const filtrados = this.productos().filter(producto => 
      producto.nombre.toLowerCase().includes(termLower) ||
      producto.tipo.toLowerCase().includes(termLower) ||
      producto.descripcion.toLowerCase().includes(termLower)
    );

    this.productosFiltrados.set(filtrados);
  }

  verDetalle(id: number) {
    this.router.navigate(['/producto', id]);
  }

  async logout() {
    await this.authService.signOut();
  }

  get userName(): string {
    const user = this.authService.currentUser();
    return user?.user_metadata?.['fullName'] || user?.email || 'Usuario';
  }

  get userEmail(): string {
    return this.authService.currentUser()?.email || '';
  }

  get noHayResultados(): boolean {
    return !this.loading() && this.productosFiltrados().length === 0 && this.searchTerm().trim() !== '';
  }

  get noHayProductos(): boolean {
    return !this.loading() && this.productos().length === 0;
  }
}

