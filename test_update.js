import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('sales').select('*').limit(1);
  if (error) {
    console.error('Fetch sales error:', error);
  } else {
    console.log('Sales table exists. Data:', data);
  }
}
run();
