import { supabase, MEDIA_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from './supabase.js';
export async function buildSignedUrlMap(paths) {
    if (paths.length === 0)
        return new Map();
    const { data: signedUrls } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);
    return new Map((signedUrls ?? [])
        .filter((s) => s.path != null && s.signedUrl != null)
        .map((s) => [s.path, s.signedUrl]));
}
//# sourceMappingURL=media-utils.js.map