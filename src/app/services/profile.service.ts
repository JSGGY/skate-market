import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Perfil {
  id: string;
  nombre: string | null;
  rol: 'admin' | 'usuario';
  creado_en: string;
}

export interface Producto {
  id?: number;
  nombre: string;
  tipo: string;
  cantidad: number;
  descripcion: string;
  precio: number;
  publicado?: boolean;
  creado_en?: string;
  vendedor_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private supabase!: SupabaseClient;
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  
  public currentProfile = signal<Perfil | null>(null);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.supabase = createClient(
        environment.supabase.url,
        environment.supabase.anonKey
      );
    }
  }

  /**
   * Obtiene el perfil del usuario actual
   */
  async getProfile(userId: string): Promise<Perfil | null> {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error al obtener perfil:', error);
        return null;
      }

      this.currentProfile.set(data);
      return data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return null;
    }
  }

  /**
   * Crea un perfil para un nuevo usuario
   */
  async createProfile(userId: string, nombre: string): Promise<boolean> {
    if (!this.isBrowser) {
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('perfiles')
        .insert({
          id: userId,
          nombre: nombre,
          rol: 'usuario'
        });

      if (error) {
        console.error('Error al crear perfil:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al crear perfil:', error);
      return false;
    }
  }

  /**
   * Crea un nuevo producto
   */
  async createProducto(producto: Producto): Promise<{ success: boolean; error?: string }> {
    if (!this.isBrowser) {
      return { success: false, error: 'Operación no disponible en el servidor' };
    }

    try {
      const { error } = await this.supabase
        .from('productos')
        .insert(producto);

      if (error) {
        console.error('Error al crear producto:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error al crear producto:', error);
      return { success: false, error: 'Error inesperado' };
    }
  }

  /**
   * Obtiene todos los productos publicados
   */
  async getProductos(): Promise<Producto[]> {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('productos')
        .select('*')
        .eq('publicado', true)
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error al obtener productos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return [];
    }
  }

  /**
   * Obtiene un producto por ID
   */
  async getProductoById(id: number): Promise<Producto | null> {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('productos')
        .select('*')
        .eq('id', id)
        .eq('publicado', true)
        .single();

      if (error) {
        console.error('Error al obtener producto:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      return null;
    }
  }

  /**
   * Verifica si el usuario tiene rol de admin
   */
  isAdmin(): boolean {
    const profile = this.currentProfile();
    return profile?.rol === 'admin';
  }
}

