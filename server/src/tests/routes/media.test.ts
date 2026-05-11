import { describe, it, expect, vi } from 'vitest';
import { authed, seedUser, seedMemory, seedMedia } from '../helpers.js';

// Mock supabase storage — we never want to hit the real service in tests
vi.mock('../../lib/supabase.js', () => ({
  MEDIA_BUCKET: 'media',
  SIGNED_URL_EXPIRY_SECONDS: 3600,
  supabase: {
    storage: {
      from: () => ({
        createSignedUploadUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://fake.upload.url', token: 'tok', path: 'test/path' },
          error: null,
        }),
        createSignedUrls: vi.fn().mockResolvedValue({
          data: [{ path: 'memories/user-1/test.jpg', signedUrl: 'https://fake.signed.url' }],
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}));

const U1 = 'user-1';
const U2 = 'user-2';

describe('POST /api/media/upload-url', () => {
  it('returns a signed upload URL', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1)
      .post('/api/media/upload-url')
      .send({ fileExtension: 'jpg', mediaType: 'image' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('signedUrl');
    expect(res.body).toHaveProperty('path');
  });

  it('returns 400 when fileExtension is missing', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/media/upload-url').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/memories/:memoryId/media', () => {
  it('creates a media record for own memory', async () => {
    await seedUser(U1, 'u1@test.com');
    const memory = await seedMemory(U1);
    const res = await authed(U1)
      .post(`/api/memories/${memory.id}/media`)
      .send({ mediaPath: `memories/${U1}/test.jpg`, mediaType: 'image' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ memoryId: memory.id, mediaType: 'image' });
  });

  it('returns 400 when mediaPath does not belong to auth user', async () => {
    await seedUser(U1, 'u1@test.com');
    const memory = await seedMemory(U1);
    const res = await authed(U1)
      .post(`/api/memories/${memory.id}/media`)
      .send({ mediaPath: `memories/other-user/test.jpg`, mediaType: 'image' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_MEDIA_PATH');
  });

  it('returns 404 for another users memory', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const memory = await seedMemory(U2);
    const res = await authed(U1)
      .post(`/api/memories/${memory.id}/media`)
      .send({ mediaPath: `memories/${U1}/test.jpg`, mediaType: 'image' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/memories/:memoryId/media', () => {
  it('returns media with signed URLs for own memory', async () => {
    await seedUser(U1, 'u1@test.com');
    const memory = await seedMemory(U1);
    await seedMedia(memory.id, U1);
    const res = await authed(U1).get(`/api/memories/${memory.id}/media`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('signedUrl');
  });

  it('returns 404 for another users private memory', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const memory = await seedMemory(U2, { visibility: 'private' });
    const res = await authed(U1).get(`/api/memories/${memory.id}/media`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/media/:id', () => {
  it('deletes own media', async () => {
    await seedUser(U1, 'u1@test.com');
    const memory = await seedMemory(U1);
    const media = await seedMedia(memory.id, U1);
    const res = await authed(U1).delete(`/api/media/${media.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(media.id);
  });

  it('returns 404 for another users media', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const memory = await seedMemory(U2);
    const media = await seedMedia(memory.id, U2);
    const res = await authed(U1).delete(`/api/media/${media.id}`);
    expect(res.status).toBe(404);
  });
});
