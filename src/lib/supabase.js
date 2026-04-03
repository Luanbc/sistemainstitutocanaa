import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://grmilcjrncnwdggfwosg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybWlsY2pybmNud2RnZ2Z3b3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTU4MjQsImV4cCI6MjA4OTUzMTgyNH0.AS3h0OMG8nmiuPnn1Beq6qybiHtMu7g97jHa9GWKHGs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
