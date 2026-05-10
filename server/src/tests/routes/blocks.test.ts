import { describe, it, expect } from 'vitest';
import { authed, seedUser, seedBlock, seedFriendship, seedFriendRequest } from '../helpers.js';

const U1 = 'user-1';
const U2 = 'user-2';

describe('POST /api/blocks', () => {
  it('blocks a user', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const res = await authed(U1).post('/api/blocks').send({ blockedId: U2 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ blockerId: U1, blockedId: U2 });
  });

  it('returns 400 when blocking self', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/blocks').send({ blockedId: U1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_BLOCK_SELF');
  });

  it('returns 404 when target user does not exist', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/blocks').send({ blockedId: 'ghost' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('returns 400 when already blocked', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedBlock(U1, U2);
    const res = await authed(U1).post('/api/blocks').send({ blockedId: U2 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALREADY_BLOCKED');
  });

  it('removes existing friendship when blocking', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedFriendship(U1, U2);
    await authed(U1).post('/api/blocks').send({ blockedId: U2 });
    // friendship should be gone — verify via friends list
    const res = await authed(U1).get('/api/friends');
    expect(res.body.length).toBe(0);
  });

  it('cancels pending friend requests when blocking', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedFriendRequest(U1, U2);
    await authed(U1).post('/api/blocks').send({ blockedId: U2 });
    const res = await authed(U1).get('/api/friend-requests');
    expect(res.body.outgoing.length).toBe(0);
  });
});

describe('GET /api/blocks', () => {
  it('returns the list of blocked users', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedBlock(U1, U2);
    const res = await authed(U1).get('/api/blocks');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].blocked.id).toBe(U2);
  });

  it('returns empty array when no blocks', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).get('/api/blocks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('DELETE /api/blocks/:userId', () => {
  it('unblocks a user', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedBlock(U1, U2);
    const res = await authed(U1).delete(`/api/blocks/${U2}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 when block does not exist', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const res = await authed(U1).delete(`/api/blocks/${U2}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BLOCK_NOT_FOUND');
  });
});
