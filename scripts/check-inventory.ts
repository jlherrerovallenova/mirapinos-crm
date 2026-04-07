
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInventory() {
  const { data, error, count } = await supabase
    .from('inventory')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total rows in inventory table: ${count}`);
  console.log('Rows:', JSON.stringify(data, null, 2));
}

checkInventory();
