import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function checkColumns() {
  const { data, error } = await supabase
    .from('newsletters')
    .select('id, subject, design, html_content, status, updated_at, sent_at')
    .limit(1);

  if (error) {
    console.log('FALTAN_COLUMNAS');
    console.log('ERROR:', error.message);
  } else {
    console.log('COLUMNAS_CORRECTAS');
  }
}

checkColumns();
