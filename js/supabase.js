// supabase.js
const SUPABASE_URL = 'https://awhqkvpjgjsiqbewesqp.supabase.co'; // Nova URL do Supabase
const SUPABASE_KEY = 'sb_publishable_X6z_d52ufsQ7gZDWAXikvw_yi_mKZBJ'; // Nova chave pública

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;