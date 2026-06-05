import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('inventory').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Inventory id:', data[0].id, 'Type:', typeof data[0].id);
  }
}
run();
