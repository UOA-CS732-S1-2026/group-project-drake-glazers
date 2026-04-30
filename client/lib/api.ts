import { useAuth } from '@clerk/expo';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) throw new Error(`API request failed: ${res.status} ${res.statusText}`);

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
