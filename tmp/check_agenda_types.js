import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkExistingValues() {
  console.log('Checking existing values in agenda table...');
  const { data, error } = await supabase.from('agenda').select('type').limit(100);
  if (error) {
    console.error('Error fetching agenda:', error);
    return;
  }
  const types = Array.from(new Set(data.map(d => d.type)));
  console.log('Unique types found in database:', types);
}

checkExistingValues();
