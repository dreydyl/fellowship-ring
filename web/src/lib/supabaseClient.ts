// Supabase client initialization.
//
// TODO: Add typed Database generics once the Supabase schema is generated
// (see: https://supabase.com/docs/guides/api/rest/generating-types).

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
