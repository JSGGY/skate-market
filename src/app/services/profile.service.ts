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
  imagen_producto?: string | null;
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
   * Convierte Base64 string a formato de imagen visualizable
   */
  private bytesToBase64(bytes: any): string | null {
    if (!bytes) return null;

    try {
      // Si ya es una cadena Base64, agregarle el prefijo si no lo tiene
      if (typeof bytes === 'string') {
        return bytes.startsWith('data:image')
          ? bytes
          : `data:image/jpeg;base64,${bytes}`;
      }

      console.warn('Formato de imagen no esperado:', typeof bytes);
      return null;
    } catch (error) {
      console.error('Error al convertir bytes a Base64:', error);
      return null;
    }
  }

  /**
   * Convierte File a Base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extraer solo la parte Base64 (sin el prefijo data:image/...)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async getProfile(userId: string): Promise<Perfil | null> {
    if (!this.isBrowser) return null;

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

  async createProfile(userId: string, nombre: string): Promise<boolean> {
    if (!this.isBrowser) return false;

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

  async createProducto(producto: Producto, imageFile?: File): Promise<{ success: boolean; error?: string }> {
    if (!this.isBrowser) {
      return { success: false, error: 'Operación no disponible en el servidor' };
    }

    try {
      let imagenBase64 = null;

      if (imageFile) {
        // Convertir File a Base64 directamente
        imagenBase64 = await this.fileToBase64(imageFile);
        console.log('Imagen convertida a Base64, longitud:', imagenBase64.length);
      }

      const { error } = await this.supabase
        .from('productos')
        .insert({
          nombre: producto.nombre,
          tipo: producto.tipo,
          cantidad: producto.cantidad,
          descripcion: producto.descripcion,
          precio: producto.precio,
          imagen_producto: imagenBase64, // Guardar como Base64 string
          publicado: producto.publicado ?? false,
          vendedor_id: producto.vendedor_id
        });

      if (error) {
        console.error('Error al crear producto:', error);
        return { success: false, error: error.message };
      }

      console.log('Producto creado exitosamente con imagen');
      return { success: true };
    } catch (error) {
      console.error('Error al crear producto:', error);
      return { success: false, error: 'Error inesperado' };
    }
  }

  async getProductos(): Promise<Producto[]> {
    if (!this.isBrowser) return [];

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

      const productosConImagenes = (data || []).map(producto => ({
        ...producto,
        imagen_producto: producto.imagen_producto
          ? this.bytesToBase64(producto.imagen_producto)
          : null
      }));

      console.log(`Productos cargados: ${productosConImagenes.length}`);
      return productosConImagenes;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return [];
    }
  }

  async getProductoById(id: number): Promise<Producto | null> {
    if (!this.isBrowser) return null;

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

      return {
        ...data,
        imagen_producto: data.imagen_producto
          ? this.bytesToBase64(data.imagen_producto)
          : null
      };
    } catch (error) {
      console.error('Error al obtener producto:', error);
      return null;
    }
  }

  isAdmin(): boolean {
    const profile = this.currentProfile();
    return profile?.rol === 'admin';
  }

  /**
   * Método de depuración: verifica el formato de las imágenes en la base de datos
   */
  async debugImagenes(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const { data, error } = await this.supabase
        .from('productos')
        .select('id, nombre, imagen_producto')
        .limit(5);

      if (error) {
        console.error('Error al obtener productos:', error);
        return;
      }

      console.log('=== DEBUG: Imágenes en la base de datos ===');
      data?.forEach(producto => {
        console.group(`Producto: ${producto.nombre} (ID: ${producto.id})`);

        if (!producto.imagen_producto) {
          console.log('❌ No tiene imagen');
        } else {
          console.log('✅ Tiene imagen');
          console.log('Tipo:', typeof producto.imagen_producto);

          if (typeof producto.imagen_producto === 'string') {
            console.log('Longitud string:', producto.imagen_producto.length);
            console.log('Primeros 100 caracteres:', producto.imagen_producto.substring(0, 100));
          } else {
            console.log('Estructura:', producto.imagen_producto);
          }

          // Intentar convertir a Base64
          const base64 = this.bytesToBase64(producto.imagen_producto);
          if (base64) {
            console.log('✅ Conversión a Base64 exitosa');
            console.log('Longitud Base64 completo:', base64.length);
          } else {
            console.log('❌ Fallo la conversión a Base64');
          }
        }

        console.groupEnd();
      });

      console.log('=== FIN DEBUG ===');
    } catch (error) {
      console.error('Error en debugImagenes:', error);
    }
  }
}
