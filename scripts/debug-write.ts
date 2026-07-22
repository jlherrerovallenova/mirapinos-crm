import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { data, error } = await supabase
    .from('leads')
    .insert([{
      name: 'Debug Lead',
      email: 'debug-lead@example.com',
      phone: '+34600123456',
      status: 'nuevo',
      source: 'load_test',
      notes: 'Debug notes.'
    }])
    .select('id')
    .single();

  console.log('Data:', data);
  console.log('Error:', error);
}

run();
