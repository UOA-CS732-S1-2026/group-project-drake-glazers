import { useAuth } from '@clerk/expo';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function uploadFile(
  signedUrl: string,
  fileUri: string,
  mimeType: string
): Promise<void> {
  const fileRes = await fetch(fileUri);
  const blob = await fileRes.blob();
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
}

/*
Usuage Example:
    const api = useApiClient();
    const memories = await api.get('/memories');
    await api.post('/memories', { title: 'My memory' });
*/

export function useApiClient() {
  const { getToken } = useAuth();

  const request = async (path: string, options: RequestInit = {}) => {
    const token = await getToken();

    if (!token) throw new Error('No auth token available');

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);

      if (res.status === 400 && body?.error?.details?.fieldErrors) {
        const firstFieldError = Object.values(body.error.details.fieldErrors).flat()[0];
        if (firstFieldError) throw new Error(firstFieldError as string);
      }

      const detail = body?.error?.message ?? body?.message ?? res.statusText;
      throw new Error(`API request failed: ${res.status} ${detail}`);
    }

    return res.json();
  };

  return {
    get: (path: string) => request(path, { method: 'GET' }),
    post: (path: string, body: any) =>
      request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path: string, body: any) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (path: string) => request(path, { method: 'DELETE' }),
  };
}
