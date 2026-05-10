import { describe, it, expect } from 'vitest';
import { authed, seedUser, seedFriendship } from '../helpers.js';

const U1 = 'user-1';
const U2 = 'user-2';

describe('GET /api/friends', () => {
  it('returns the list of friends', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedFriendship(U1, U2);
    const res = await authed(U1).get('/api/friends');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].friend.id).toBe(U2);
  });

  it('returns empty array when user has no friends', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).get('/api/friends');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('DELETE /api/friends/:userId', () => {
  it('removes a friendship', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedFriendship(U1, U2);
    const res = await authed(U1).delete(`/api/friends/${U2}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 when friendship does not exist', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const res = await authed(U1).delete(`/api/friends/${U2}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('FRIENDSHIP_NOT_FOUND');
  });

  it('returns 400 when trying to unfriend self', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).delete(`/api/friends/${U1}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_UNFRIEND_SELF');
  });
});
