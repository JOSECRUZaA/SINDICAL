import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ehpjiewdfejwzwrpmlez.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocGppZXdkZmVqd3p3cnBtbGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDA4MTAsImV4cCI6MjA5NjM3NjgxMH0.4Y2H_M1Cf7_xa7Mk3TC0MZc7GpMAMckAD77bSU-geCc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: cuotas } = await supabase.from('tipos_cuota').select('*');
    const { data: multas } = await supabase.from('tipos_multa').select('*');
    console.log("Cuotas:", cuotas);
    console.log("Multas:", multas);
}
test();
