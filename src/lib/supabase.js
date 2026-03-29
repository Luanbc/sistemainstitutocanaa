import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://grmilcjrncnwdggfwosg.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ONrNssrCVgz5RTPsslAiFg_3SnKedki';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
