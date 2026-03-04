import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test com Pamella
const evaluationId = '74e6d77d-5b4c-4cca-bb7e-9afa30e039f6';

const { data, error } = await supabase.functions.invoke('format-lead-report', {
  body: { evaluationId, forceRefresh: true }
});

if (error) {

  // Try to get error body
  if (error.context?.body) {
    try {
      const reader = error.context.body.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
    } catch (e) {
    }
  }
} else {

  if (data?.error) {
  }
}
