// Archivo de ejemplo para configuración de desarrollo
// 1. Copia este archivo y renómbralo a 'environment.ts'
// 2. Reemplaza los valores con tus credenciales de Supabase
// 3. Obtén tus credenciales en: https://app.supabase.com → Tu Proyecto → Settings → API

export const environment = {
  production: false,
  supabase: {
    // Project URL - Ej: https://xyzcompany.supabase.co
    url: 'https://tu-proyecto.supabase.co',
    
    // API Key (anon, public) - Es una clave muy larga (~200 caracteres)
    anonKey: 'tu-anon-key-aqui'
  }
};

