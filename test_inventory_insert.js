import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { error } = await supabase.from('inventory').insert([{ id: '123e4567-e89b-12d3-a456-426614174000', modelo: 'Test', numero_vivienda: '1', superficie_parcela: 0, superficie_util: 0, superficie_construida: 0, habitaciones: 1, banos: 1, precio: 0 }]);
  console.log('Insert UUID error:', error);

  const { error: error2 } = await supabase.from('inventory').insert([{ id: 1, modelo: 'Test', numero_vivienda: '1', superficie_parcela: 0, superficie_util: 0, superficie_construida: 0, habitaciones: 1, banos: 1, precio: 0 }]);
  console.log('Insert INTEGER error:', error2);
}
run();
