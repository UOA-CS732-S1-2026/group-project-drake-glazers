import { describe, it, expect } from 'vitest';
import { authed, seedUser, seedMemory, seedFriendship, seedBlock } from '../helpers.js';

const U1 = 'user-1';
const U2 = 'user-2';

const memoryPayload = {
  title: 'Test Memory',
  latitude: 51.5,
  longitude: -0.1,
  visibility: 'public',
};

describe('POST /api/memories', () => {
  it('creates a memory', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/memories').send(memoryPayload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Test Memory', userId: U1 });
  });

  it('returns 400 when required fields are missing', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/memories').send({ title: 'No coords' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/memories', () => {
  it('returns all memories for the auth user', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedMemory(U1);
    await seedMemory(U1, { title: 'Second' });
    const res = await authed(U1).get('/api/memories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('does not return other users memories', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedMemory(U2);
    const res = await authed(U1).get('/api/memories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });
});

describe('GET /api/memories/:id', () => {
  it('returns own memory', async () => {
    await seedUser(U1, 'u1@test.com');
    const memory = await seedMemory(U1);
    const res = await authed(U1).get(`/api/memories/${memory.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(memory.id);
  });

  it('returns 404 for another users private memory', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const memory = await seedMemory(U2, { visibility: 'private' });
    const res = await authed(U1).get(`/api/memories/${memory.id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for nonexistent memory', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).get('/api/memories/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/memories/:id', () => {
  it('updates own memory', async () => {
    await seedUser(U1, 'u1@test.com');
    const memory = await seedMemory(U1);
    const res = await authed(U1).put(`/api/memories/${memory.id}`).send({ title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('returns 404 when updating another users memory', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const memory = await seedMemory(U2);
    const res = await authed(U1).put(`/api/memories/${memory.id}`).send({ title: 'Hack' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/memories/:id', () => {
  it('deletes own memory', async () => {
    await seedUser(U1, 'u1@test.com');
    const memory = await seedMemory(U1);
    const res = await authed(U1).delete(`/api/memories/${memory.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(memory.id);
  });

  it('returns 404 when deleting another users memory', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const memory = await seedMemory(U2);
    const res = await authed(U1).delete(`/api/memories/${memory.id}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/users/:userId/memories', () => {
  it('owner sees all their memories', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedMemory(U1, { visibility: 'private' });
    await seedMemory(U1, { visibility: 'friends_only' });
    await seedMemory(U1, { visibility: 'public' });
    const res = await authed(U1).get(`/api/users/${U1}/memories`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });

  it('friend sees public and friends_only memories', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedFriendship(U1, U2);
    await seedMemory(U1, { visibility: 'private' });
    await seedMemory(U1, { visibility: 'friends_only' });
    await seedMemory(U1, { visibility: 'public' });
    const res = await authed(U2).get(`/api/users/${U1}/memories`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body.every((m: { visibility: string }) => m.visibility !== 'private')).toBe(true);
  });

  it('stranger sees only public memories', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedMemory(U1, { visibility: 'private' });
    await seedMemory(U1, { visibility: 'friends_only' });
    await seedMemory(U1, { visibility: 'public' });
    const res = await authed(U2).get(`/api/users/${U1}/memories`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].visibility).toBe('public');
  });

  it('returns 404 when blocked', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedBlock(U1, U2);
    const res = await authed(U2).get(`/api/users/${U1}/memories`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for nonexistent user', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).get('/api/users/ghost/memories');
    expect(res.status).toBe(404);
  });
});
