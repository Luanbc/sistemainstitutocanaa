import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pckpfawvefcilatfwmqz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xUKjISLq2b-bKE2A_WmI_w_ueL5E7Ol'; // Use valid key from .env or config
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('alunos').select('*').limit(1);
  if (error) {
    console.error('Error fetching data:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in alunos:', Object.keys(data[0]));
  } else {
    console.log('No data in alunos table to check columns.');
  }
}

checkSchema();
