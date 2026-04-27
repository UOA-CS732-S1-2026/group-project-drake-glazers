const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const DEV_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (DEV_USER_ID) {
    headers['x-dev-user-id'] = DEV_USER_ID;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export type Memory = {
  id: string;
  userId: string;
  title: string;
  latitude: number;
  longitude: number;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
};

export const api = {
  memories: {
    list: () => request<Memory[]>('/api/memories'),
  },
};
