import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const email = `testloaduser${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const password = 'TestPassword123!';
  console.log(`Trying to sign up: ${email}`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  console.log('SignUp Data:', data);
  console.log('SignUp Error:', error);
}

run();
