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

async function createBucket() {
    console.log('Attempting to create bucket "documents"...');
    const { data, error } = await supabase.storage.createBucket('documents', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
        console.error('Error creating bucket:', error);
        console.log('NOTE: You might need to create the bucket "documents" manually in the Supabase Dashboard if the Anon Key lacks permissions.');
    } else {
        console.log('Bucket "documents" created successfully:', data);
    }
}

createBucket();
