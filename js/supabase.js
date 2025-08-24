// supabase.js
const SUPABASE_URL = 'https://qostwvcacxpggahhrzsk.supabase.co'; // Sua URL do Supabase
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvc3R3dmNhY3hwZ2dhaGhyenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDA3MTcsImV4cCI6MjA3MDYxNjcxN30.OTty2Z1BRDwJZ39H-HTEnC3aE6CZZTBKEaT59d7NAUQ'; // Sua chave pública (não exposta para leitura no cliente)

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;
