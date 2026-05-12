import { supabase, MEDIA_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from './supabase.js';

export async function buildSignedUrlMap(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();

  const { data: signedUrls } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);

  return new Map(
    (signedUrls ?? [])
      .filter((s) => s.path != null && s.signedUrl != null)
      .map((s) => [s.path as string, s.signedUrl as string])
  );
}
