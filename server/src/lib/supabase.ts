import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const MEDIA_BUCKET = 'memories-media';
export const PROFILE_PICTURES_BUCKET = 'profile-pictures';
export const SIGNED_URL_EXPIRY_SECONDS = 3600;
