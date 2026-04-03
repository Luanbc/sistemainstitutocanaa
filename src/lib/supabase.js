import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pckpfawvefcilatfwmqz.supabase.co';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBja3BmYXd2ZWZjaWxhdGZ3bXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjM3NzksImV4cCI6MjA4OTE5OTc3OX0.Z7l3MafVU7oE7Ifqh4JCT-CQIaslOrAJwQlbEGl-21M';



export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

