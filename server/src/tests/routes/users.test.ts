import { describe, it, expect } from 'vitest';
import {
  authed,
  seedUser,
  seedFriendship,
  seedFriendRequest,
  seedBlock,
  seedUserProfile,
} from '../helpers.js';

const U1 = 'user-1';
const U2 = 'user-2';

describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const res = await authed(U1).post('/api/users').send({ email: 'u1@test.com' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: U1, email: 'u1@test.com' });
  });

  it('returns 200 and existing user when email matches', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/users').send({ email: 'u1@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(U1);
  });

  it('updates email when user exists with different email', async () => {
    await seedUser(U1, 'old@test.com');
    const res = await authed(U1).post('/api/users').send({ email: 'new@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('new@test.com');
  });

  it('returns 400 when email is already taken by another user', async () => {
    await seedUser(U1, 'taken@test.com');
    const res = await authed(U2).post('/api/users').send({ email: 'taken@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMAIL_CONFLICT');
  });

  it('returns 400 when email is missing', async () => {
    const res = await authed(U1).post('/api/users').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/users/me', () => {
  it('returns the authenticated user', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).get('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(U1);
  });

  it('returns 404 when user does not exist', async () => {
    const res = await authed(U1).get('/api/users/me');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });
});

describe('PUT /api/users/me', () => {
  it('updates the email', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).put('/api/users/me').send({ email: 'updated@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('updated@test.com');
  });

  it('returns 400 when email is missing from body', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).put('/api/users/me').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 when user does not exist', async () => {
    const res = await authed(U1).put('/api/users/me').send({ email: 'x@test.com' });
    expect(res.status).toBe(404);
  });

  it('returns 400 on email conflict', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const res = await authed(U1).put('/api/users/me').send({ email: 'u2@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMAIL_CONFLICT');
  });
});

describe('DELETE /api/users/me', () => {
  it('deletes the user', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).delete('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(U1);
  });

  it('returns 404 when user does not exist', async () => {
    const res = await authed(U1).delete('/api/users/me');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/users/search', () => {
  it('returns matching users', async () => {
    await seedUser(U1, 'searcher@test.com');
    await seedUser(U2, 'findme@test.com');
    const res = await authed(U1).get('/api/users/search?q=findme');
    expect(res.status).toBe(200);
    expect(res.body.some((u: { id: string }) => u.id === U2)).toBe(true);
  });

  it('excludes self from results', async () => {
    await seedUser(U1, 'searcher@test.com');
    const res = await authed(U1).get('/api/users/search?q=searcher');
    expect(res.status).toBe(200);
    expect(res.body.some((u: { id: string }) => u.id === U1)).toBe(false);
  });

  it('returns 400 when q is missing', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).get('/api/users/search');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('QUERY_REQUIRED');
  });
});

describe('GET /api/users/:userId/relationship', () => {
  it('returns none when no relationship exists', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const res = await authed(U1).get(`/api/users/${U2}/relationship`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('none');
  });

  it('returns 400 when checking self', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).get(`/api/users/${U1}/relationship`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_CHECK_SELF');
  });

  it('returns 404 when target user does not exist', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).get('/api/users/ghost/relationship');
    expect(res.status).toBe(404);
  });

  it('returns friends status', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedFriendship(U1, U2);
    const res = await authed(U1).get(`/api/users/${U2}/relationship`);
    expect(res.body.status).toBe('friends');
  });

  it('returns pending_outgoing when auth user sent request', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedFriendRequest(U1, U2);
    const res = await authed(U1).get(`/api/users/${U2}/relationship`);
    expect(res.body.status).toBe('pending_outgoing');
  });

  it('returns blocked_by_me status', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedBlock(U1, U2);
    const res = await authed(U1).get(`/api/users/${U2}/relationship`);
    expect(res.body.status).toBe('blocked_by_me');
  });
});

describe('GET /api/users/me/profile', () => {
  it('returns the profile', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUserProfile(U1, 'Alice');
    const res = await authed(U1).get('/api/users/me/profile');
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Alice');
  });

  it('returns 404 when profile does not exist', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).get('/api/users/me/profile');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_PROFILE_NOT_FOUND');
  });
});

describe('PUT /api/users/me/profile', () => {
  it('creates profile when none exists', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).put('/api/users/me/profile').send({ displayName: 'Alice' });
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Alice');
  });

  it('updates existing profile', async () => {
    await seedUser(U1, 'u1@test.com');
    await authed(U1).put('/api/users/me/profile').send({ displayName: 'Alice' });
    const res = await authed(U1).put('/api/users/me/profile').send({ displayName: 'Bob' });
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Bob');
  });
});
