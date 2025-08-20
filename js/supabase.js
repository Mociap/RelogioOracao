// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Importar configurações
let supabaseConfig;
try {
  // Tentar importar configurações personalizadas
  const configModule = await import('../config.js');
  supabaseConfig = configModule.supabaseConfig;
} catch (error) {
  // Fallback para configurações padrão (desenvolvimento)
  console.warn('Arquivo config.js não encontrado, usando configurações padrão do Supabase');
  supabaseConfig = {
    url: 'https://qostwvcacxpggahhrzsk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvc3R3dmNhY3hwZ2dhaGhyenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDA3MTcsImV4cCI6MjA3MDYxNjcxN30.OTty2Z1BRDwJZ39H-HTEnC3aE6CZZTBKEaT59d7NAUQ'
  };
}

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

export default supabase;
