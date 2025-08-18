// Adapter para migrar de Supabase a PostgreSQL sin cambiar todos los componentes
export const supabaseAdapter = {
  async readQuery(query: string): Promise<any> {
    try {
      console.log('🔄 Supabase query intercepted, redirecting to PostgreSQL:', query);
      
      const response = await fetch('http://localhost:3001/api/supabase-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`PostgreSQL query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Supabase adapter error:', error);
      throw error;
    }
  }
};