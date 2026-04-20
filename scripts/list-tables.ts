import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Listing all accessible tables...');
    // No hay una forma directa de listar tablas con el cliente JS sin permiso de admin
    // pero podemos probar con las sospechosas.
    const candidates = ['settings', 'configuracion', 'config', 'integrations', 'app_settings'];
    for (const table of candidates) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`Table "${table}" NOT found or NOT accessible: ${error.message}`);
        } else {
            console.log(`Table "${table}" FOUND!`);
        }
    }
}

listTables();
