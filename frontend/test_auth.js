import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ehpjiewdfejwzwrpmlez.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocGppZXdkZmVqd3p3cnBtbGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDA4MTAsImV4cCI6MjA5NjM3NjgxMH0.4Y2H_M1Cf7_xa7Mk3TC0MZc7GpMAMckAD77bSU-geCc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@sindicato.com',
    password: 'admin12345'
  });
  
  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }
  
  console.log('Logged in as:', authData.user.email);
  
  console.log('Fetching categorias_licencia...');
  const { data: catData, error: catError } = await supabase.from('categorias_licencia').select('*');
  console.log('Categorias Data:', catData);
  if (catError) console.error('Categorias Error:', catError);

  console.log('Fetching afiliados...');
  const { data: afData, error: afError } = await supabase.from('afiliados').select('*');
  console.log('Afiliados Data:', afData);
  if (afError) console.error('Afiliados Error:', afError);
}

test();
