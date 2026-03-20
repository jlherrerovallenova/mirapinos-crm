import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function checkTable() {
  const { error } = await supabase
    .from('newsletters')
    .select('id')
    .limit(1);

  if (error) {
    if (error.code === '42P01') {
      console.log('TABLA_NO_EXISTE');
    } else {
      console.log('ERROR:', error.message);
    }
  } else {
    console.log('TABLA_EXISTE');
  }
}

checkTable();

