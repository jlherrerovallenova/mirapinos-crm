import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTypes() {
  const type = 'Supernova DEFINITELY WRONG TYPE';
  console.log(`Testing type: ${type}`);
  const { error } = await supabase.from('agenda').insert([{
    title: 'TEST_DELETE_ME',
    type: type,
    due_date: new Date().toISOString()
  }]);
  if (error) {
    console.log(`  Failed with error: ${error.message} (code: ${error.code})`);
  } else {
    console.log(`  SUCCESS! Type '${type}' is allowed.`);
  }
}

testTypes();
