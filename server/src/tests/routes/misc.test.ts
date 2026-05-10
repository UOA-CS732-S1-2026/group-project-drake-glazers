import { describe, it, expect } from 'vitest';
import { request, authed } from '../helpers.js';

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/auth/me', () => {
  it('returns userId when authenticated', async () => {
    const res = await authed('user-1').get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'user-1' });
  });

  it('returns 401 without auth header', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
