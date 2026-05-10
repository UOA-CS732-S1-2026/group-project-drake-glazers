import { describe, it, expect } from 'vitest';
import { authed, seedUser, seedFriendRequest, seedBlock } from '../helpers.js';

const U1 = 'user-1';
const U2 = 'user-2';

describe('POST /api/friend-requests', () => {
  it('sends a friend request', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const res = await authed(U1).post('/api/friend-requests').send({ toUserId: U2 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ fromUserId: U1, toUserId: U2, status: 'pending' });
  });

  it('returns 400 when sending to self', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/friend-requests').send({ toUserId: U1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_SEND_TO_SELF');
  });

  it('returns 404 when recipient does not exist', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/friend-requests').send({ toUserId: 'ghost' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('returns 400 when a pending request already exists', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedFriendRequest(U1, U2);
    const res = await authed(U1).post('/api/friend-requests').send({ toUserId: U2 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FRIEND_REQUEST_ALREADY_EXISTS');
  });

  it('returns 400 when blocked', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedBlock(U1, U2);
    const res = await authed(U1).post('/api/friend-requests').send({ toUserId: U2 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BLOCKED');
  });
});

describe('GET /api/friend-requests', () => {
  it('returns incoming and outgoing requests', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedFriendRequest(U1, U2);
    await seedFriendRequest(U2, U1);

    // seed an incoming from a 3rd user
    const res = await authed(U1).get('/api/friend-requests');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('incoming');
    expect(res.body).toHaveProperty('outgoing');
    expect(res.body.outgoing[0].fromUserId).toBe(U1);
    expect(res.body.incoming[0].toUserId).toBe(U1);
  });
});

describe('PUT /api/friend-requests/:id/accept', () => {
  it('accepts a friend request and creates friendship', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const req = await seedFriendRequest(U1, U2);
    const res = await authed(U2).put(`/api/friend-requests/${req.id}/accept`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
  });

  it('returns 400 when non-recipient tries to accept', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const req = await seedFriendRequest(U1, U2);
    const res = await authed(U1).put(`/api/friend-requests/${req.id}/accept`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NOT_RECIPIENT');
  });

  it('returns 404 when request does not exist', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).put('/api/friend-requests/ghost-id/accept');
    expect(res.status).toBe(404);
  });

  it('returns 400 when request is not pending', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const req = await seedFriendRequest(U1, U2);
    // accept first
    await authed(U2).put(`/api/friend-requests/${req.id}/accept`);
    // try again
    const res = await authed(U2).put(`/api/friend-requests/${req.id}/accept`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FRIEND_REQUEST_NOT_PENDING');
  });
});

describe('PUT /api/friend-requests/:id/decline', () => {
  it('declines a friend request', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const req = await seedFriendRequest(U1, U2);
    const res = await authed(U2).put(`/api/friend-requests/${req.id}/decline`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
  });

  it('returns 400 when non-recipient tries to decline', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const req = await seedFriendRequest(U1, U2);
    const res = await authed(U1).put(`/api/friend-requests/${req.id}/decline`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NOT_RECIPIENT');
  });

  it('returns 404 when request does not exist', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).put('/api/friend-requests/ghost-id/decline');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/friend-requests/:id', () => {
  it('cancels an outgoing request', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const req = await seedFriendRequest(U1, U2);
    const res = await authed(U1).delete(`/api/friend-requests/${req.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(req.id);
  });

  it('returns 400 when non-sender tries to cancel', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const req = await seedFriendRequest(U1, U2);
    const res = await authed(U2).delete(`/api/friend-requests/${req.id}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NOT_SENDER');
  });

  it('returns 404 when request does not exist', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).delete('/api/friend-requests/ghost-id');
    expect(res.status).toBe(404);
  });
});
