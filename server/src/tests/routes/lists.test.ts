import { describe, it, expect } from 'vitest';
import { authed, seedUser, seedList, seedListItem } from '../helpers.js';

const U1 = 'user-1';
const U2 = 'user-2';

describe('POST /api/lists', () => {
  it('creates a list', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/lists').send({ name: 'My List' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'My List', userId: U1 });
  });

  it('returns 400 when name is missing', async () => {
    await seedUser(U1, 'u1@test.com');
    const res = await authed(U1).post('/api/lists').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/lists', () => {
  it('returns lists for auth user', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedList(U1, 'List A');
    await seedList(U1, 'List B');
    const res = await authed(U1).get('/api/lists');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('does not return other users lists', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    await seedList(U2, 'Other List');
    const res = await authed(U1).get('/api/lists');
    expect(res.body.length).toBe(0);
  });
});

describe('GET /api/lists/:id', () => {
  it('returns own list', async () => {
    await seedUser(U1, 'u1@test.com');
    const list = await seedList(U1);
    const res = await authed(U1).get(`/api/lists/${list.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(list.id);
  });

  it('returns 404 for another users list', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const list = await seedList(U2);
    const res = await authed(U1).get(`/api/lists/${list.id}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/lists/:id', () => {
  it('updates own list', async () => {
    await seedUser(U1, 'u1@test.com');
    const list = await seedList(U1, 'Old Name');
    const res = await authed(U1).put(`/api/lists/${list.id}`).send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  it('returns 404 for another users list', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const list = await seedList(U2);
    const res = await authed(U1).put(`/api/lists/${list.id}`).send({ name: 'Hack' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/lists/:id', () => {
  it('deletes own list', async () => {
    await seedUser(U1, 'u1@test.com');
    const list = await seedList(U1);
    const res = await authed(U1).delete(`/api/lists/${list.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(list.id);
  });

  it('returns 404 for another users list', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const list = await seedList(U2);
    const res = await authed(U1).delete(`/api/lists/${list.id}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/lists/:id/items', () => {
  it('creates a list item', async () => {
    await seedUser(U1, 'u1@test.com');
    const list = await seedList(U1);
    const res = await authed(U1)
      .post(`/api/lists/${list.id}/items`)
      .send({ latitude: 51.5, longitude: -0.1 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ listId: list.id, latitude: 51.5 });
  });

  it('returns 404 when list belongs to another user', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const list = await seedList(U2);
    const res = await authed(U1)
      .post(`/api/lists/${list.id}/items`)
      .send({ latitude: 1, longitude: 1 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when coordinates are missing', async () => {
    await seedUser(U1, 'u1@test.com');
    const list = await seedList(U1);
    const res = await authed(U1).post(`/api/lists/${list.id}/items`).send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/lists/:id/items', () => {
  it('returns items for own list', async () => {
    await seedUser(U1, 'u1@test.com');
    const list = await seedList(U1);
    await seedListItem(list.id);
    await seedListItem(list.id);
    const res = await authed(U1).get(`/api/lists/${list.id}/items`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('returns 404 for another users list', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const list = await seedList(U2);
    const res = await authed(U1).get(`/api/lists/${list.id}/items`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/lists/:id/items/:itemId', () => {
  it('updates a list item', async () => {
    await seedUser(U1, 'u1@test.com');
    const list = await seedList(U1);
    const item = await seedListItem(list.id);
    const res = await authed(U1)
      .put(`/api/lists/${list.id}/items/${item.id}`)
      .send({ notes: 'Visit this place' });
    expect(res.status).toBe(200);
    expect(res.body.notes).toBe('Visit this place');
  });

  it('returns 404 for item in another users list', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const list = await seedList(U2);
    const item = await seedListItem(list.id);
    const res = await authed(U1)
      .put(`/api/lists/${list.id}/items/${item.id}`)
      .send({ notes: 'Hack' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/lists/:id/items/:itemId', () => {
  it('deletes a list item', async () => {
    await seedUser(U1, 'u1@test.com');
    const list = await seedList(U1);
    const item = await seedListItem(list.id);
    const res = await authed(U1).delete(`/api/lists/${list.id}/items/${item.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(item.id);
  });

  it('returns 404 for item in another users list', async () => {
    await seedUser(U1, 'u1@test.com');
    await seedUser(U2, 'u2@test.com');
    const list = await seedList(U2);
    const item = await seedListItem(list.id);
    const res = await authed(U1).delete(`/api/lists/${list.id}/items/${item.id}`);
    expect(res.status).toBe(404);
  });
});
