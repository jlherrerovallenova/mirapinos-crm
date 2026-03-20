
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAgendaTable() {
  const { data, error } = await supabase
    .from('agenda')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching from agenda:', error)
  } else {
    console.log('Columns in agenda:', data.length > 0 ? Object.keys(data[0]) : 'No rows found to determine columns')
  }

  // Also check RPC or information_schema if possible, but simplest is to try an insert and see the error
}

checkAgendaTable()
