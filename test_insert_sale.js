import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: lead } = await supabase.from('leads').select('id').limit(1).single();
  const { data: prop } = await supabase.from('inventory').select('id, precio').limit(1).single();
  
  if (!lead || !prop) {
    console.log('No lead or prop');
    return;
  }

  const { data, error } = await supabase.from('sales').insert([{
    lead_id: lead.id,
    property_id: prop.id,
    sale_status: 'reserva',
    sale_price: prop.precio,
    iva_percentage: 10,
    reservation_amount: 6000,
    reservation_date: new Date().toISOString().slice(0, 10),
  }]).select().single();

  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}
run();
