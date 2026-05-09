# Memoriez API

Base URL: `http://localhost:3000`

## Authentication

All `/api/*` endpoints require authentication. Two modes are supported:

| Mode | How |
|---|---|
| **Production** | `Authorization: Bearer <clerk_jwt>` header |
| **Development** | `x-dev-user-id: <user_id>` header (requires `DEV_BYPASS_AUTH=true` env var) |

Unauthenticated requests return:
```json
{ "error": { "code": "UNAUTHORIZED", "message": "Unauthorized" } }
```

### Error Response Shape

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

---

## Health

### `GET /health`
No auth required.

**Response `200`**
```json
{ "status": "ok" }
```

---

## Auth

### `GET /api/auth/me`
Returns the authenticated user's ID.

**Response `200`**
```json
{ "userId": "string" }
```

---

## Users

### `POST /api/users`
Create or sync a user (upsert by Clerk user ID).

**Body**
```json
{ "email": "user@example.com" }
```

**Response `200` / `201`**
```json
{
  "id": "string",
  "email": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Errors** `400 EMAIL_CONFLICT` · `400 USER_CREATE_OR_SYNC_FAILED`

---

### `GET /api/users/me`
Get the authenticated user.

**Response `200`** — same shape as POST /api/users

**Errors** `404 USER_NOT_FOUND`

---

### `PUT /api/users/me`
Update the authenticated user's email.

**Body** *(at least one field)*
```json
{ "email": "new@example.com" }
```

**Response `200`** — same shape as POST /api/users

**Errors** `400 EMAIL_CONFLICT` · `404 USER_NOT_FOUND` · `400 USER_UPDATE_FAILED`

---

### `DELETE /api/users/me`
Delete the authenticated user's account.

**Response `200`** — deleted user object

**Errors** `404 USER_NOT_FOUND` · `400 USER_DELETE_CONSTRAINT` · `400 USER_DELETE_FAILED`

---

### `GET /api/users/me/profile`
Get the authenticated user's profile.

**Response `200`**
```json
{
  "id": "string",
  "userId": "string",
  "displayName": "string",
  "bio": "string | null",
  "avatarUrl": "string | null"
}
```

**Errors** `404 USER_PROFILE_NOT_FOUND`

---

### `PUT /api/users/me/profile`
Update the authenticated user's profile.

**Body** *(at least one field)*
```json
{
  "displayName": "string (1–100 chars)",
  "bio": "string (max 500 chars)",
  "avatarUrl": "https://..."
}
```

**Response `200`** — same shape as GET /api/users/me/profile

**Errors** `404 USER_PROFILE_NOT_FOUND` · `400 USER_PROFILE_UPDATE_FAILED`

---

## Memories

### `GET /api/memories`
List all memories for the authenticated user.

**Response `200`**
```json
[
  {
    "id": "string",
    "userId": "string",
    "title": "string",
    "latitude": -90,
    "longitude": -180,
    "visibility": "public | private",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
]
```

---

### `POST /api/memories`
Create a new memory.

**Body**
```json
{
  "title": "string (1–255 chars)",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "visibility": "public | private"
}
```

**Response `201`** — memory object

**Errors** `404 USER_NOT_FOUND` · `400 MEMORY_CREATE_FAILED`

---

### `GET /api/memories/:id`
Get a single memory with its media (includes signed URLs).

**Response `200`**
```json
{
  "id": "string",
  "userId": "string",
  "title": "string",
  "latitude": 0,
  "longitude": 0,
  "visibility": "public | private",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "media": [
    {
      "id": "string",
      "memoryId": "string",
      "mediaPath": "string",
      "mediaType": "image | video | voice_note",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601",
      "signedUrl": "string | null"
    }
  ]
}
```

**Errors** `404 MEMORY_NOT_FOUND` · `500 MEDIA_SIGNING_FAILED`

---

### `PUT /api/memories/:id`
Update a memory.

**Body** *(at least one field)*
```json
{
  "title": "string (1–255 chars)",
  "latitude": 0,
  "longitude": 0,
  "visibility": "public | private"
}
```

**Response `200`** — memory object

**Errors** `404 MEMORY_NOT_FOUND` · `400 MEMORY_UPDATE_FAILED`

---

### `DELETE /api/memories/:id`
Delete a memory and all its items and media files.

**Response `200`** — deleted memory object

**Errors** `404 MEMORY_NOT_FOUND` · `400 MEMORY_DELETE_FAILED`

---

## Memory Items

### `GET /api/memories/:id/items`
List all items in a memory.

**Response `200`**
```json
[
  {
    "id": "string",
    "memoryId": "string",
    "title": "string",
    "description": "string | null",
    "mediaType": "image | video | voice_note",
    "mediaUrl": "string | null",
    "sortOrder": 0,
    "createdAt": "ISO8601"
  }
]
```

**Errors** `404 MEMORY_NOT_FOUND`

---

### `POST /api/memories/:id/items`
Add an item to a memory.

**Body**
```json
{
  "title": "string (1–255 chars)",
  "description": "string (max 1000 chars)",
  "mediaType": "image | video | voice_note",
  "mediaUrl": "https://...",
  "sortOrder": 0
}
```

**Response `201`** — memory item object

**Errors** `404 MEMORY_NOT_FOUND` · `400 MEMORY_ITEM_CREATE_FAILED`

---

### `PUT /api/memories/:id/items/:itemId`
Update a memory item.

**Body** *(at least one field)*
```json
{
  "title": "string (1–255 chars)",
  "description": "string (max 1000 chars)",
  "mediaType": "image | video | voice_note",
  "mediaUrl": "https://...",
  "sortOrder": 0
}
```

**Response `200`** — memory item object

**Errors** `404 MEMORY_NOT_FOUND` · `404 MEMORY_ITEM_NOT_FOUND` · `400 MEMORY_ITEM_UPDATE_FAILED`

---

### `DELETE /api/memories/:id/items/:itemId`
Delete a memory item.

**Response `200`** — deleted memory item object

**Errors** `404 MEMORY_NOT_FOUND` · `404 MEMORY_ITEM_NOT_FOUND` · `400 MEMORY_ITEM_DELETE_FAILED`

---

## Media

### `POST /api/media/upload-url`
Get a signed URL for direct upload to Supabase Storage.

Rate limited to **30 requests per 15 minutes** per user.

**Body**
```json
{
  "mediaType": "image | video | voice_note",
  "fileExtension": "jpg"
}
```

Valid extensions per type:
- `image` → `jpg`, `jpeg`, `png`, `heic`, `webp`
- `video` → `mp4`, `mov`
- `voice_note` → `m4a`, `mp3`, `wav`

**Response `200`**
```json
{
  "signedUrl": "https://...",
  "token": "string",
  "path": "memories/{userId}/{uuid}.{ext}"
}
```

**Errors** `400 VALIDATION_ERROR` · `500 UPLOAD_URL_FAILED` · `429 RATE_LIMIT_EXCEEDED`

---

### `POST /api/memories/:memoryId/media`
Register a media file after uploading it via the signed URL.

**Body**
```json
{
  "mediaPath": "memories/{userId}/{uuid}.jpg",
  "mediaType": "image | video | voice_note"
}
```

**Response `201`**
```json
{
  "id": "string",
  "memoryId": "string",
  "mediaPath": "string",
  "mediaType": "image | video | voice_note",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Errors** `400 INVALID_MEDIA_PATH` · `404 MEMORY_NOT_FOUND` · `400 MEDIA_CREATE_FAILED`

---

### `GET /api/memories/:memoryId/media`
List all media for a memory (includes signed URLs).

**Response `200`** — array of media objects with `signedUrl` field

**Errors** `404 MEMORY_NOT_FOUND` · `500 SIGNED_URL_FAILED`

---

### `DELETE /api/media/:id`
Delete a media record and its file from storage.

**Response `200`**
```json
{ "id": "string" }
```

**Errors** `404 MEDIA_NOT_FOUND` · `400 MEDIA_DELETE_FAILED` · `500 MEDIA_DELETE_FAILED`

---

## Lists

### `GET /api/lists`
List all lists for the authenticated user.

**Response `200`**
```json
[
  {
    "id": "string",
    "userId": "string",
    "name": "string",
    "description": "string | null",
    "createdAt": "ISO8601"
  }
]
```

---

### `POST /api/lists`
Create a new list.

**Body**
```json
{
  "name": "string (1–255 chars)",
  "description": "string (max 1000 chars)"
}
```

**Response `201`** — list object

**Errors** `404 USER_NOT_FOUND` · `400 LIST_CREATE_FAILED`

---

### `GET /api/lists/:id`
Get a single list.

**Response `200`** — list object

**Errors** `404 LIST_NOT_FOUND`

---

### `PUT /api/lists/:id`
Update a list.

**Body** *(at least one field)*
```json
{
  "name": "string (1–255 chars)",
  "description": "string (max 1000 chars)"
}
```

**Response `200`** — list object

**Errors** `404 LIST_NOT_FOUND` · `400 LIST_UPDATE_FAILED`

---

### `DELETE /api/lists/:id`
Delete a list.

**Response `200`** — deleted list object

**Errors** `404 LIST_NOT_FOUND` · `400 LIST_DELETE_FAILED`

---

## List Items

### `GET /api/lists/:id/items`
List all items in a list.

**Response `200`**
```json
[
  {
    "id": "string",
    "listId": "string",
    "latitude": 0,
    "longitude": 0,
    "notes": "string | null",
    "createdAt": "ISO8601"
  }
]
```

**Errors** `404 LIST_NOT_FOUND`

---

### `POST /api/lists/:id/items`
Add an item to a list.

**Body**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "notes": "string (max 1000 chars)"
}
```

**Response `201`** — list item object

**Errors** `404 LIST_NOT_FOUND` · `400 LIST_ITEM_CREATE_FAILED`

---

### `PUT /api/lists/:id/items/:itemId`
Update a list item.

**Body** *(at least one field)*
```json
{
  "latitude": 0,
  "longitude": 0,
  "notes": "string (max 1000 chars)"
}
```

**Response `200`** — list item object

**Errors** `404 LIST_NOT_FOUND` · `404 LIST_ITEM_NOT_FOUND` · `400 LIST_ITEM_UPDATE_FAILED`

---

### `DELETE /api/lists/:id/items/:itemId`
Delete a list item.

**Response `200`** — deleted list item object

**Errors** `404 LIST_NOT_FOUND` · `404 LIST_ITEM_NOT_FOUND` · `400 LIST_ITEM_DELETE_FAILED`

---

## Friend Requests

### `POST /api/friend-requests`
Send a friend request.

**Body**
```json
{ "toUserId": "string" }
```

**Response `201`**
```json
{
  "id": "string",
  "fromUserId": "string",
  "toUserId": "string",
  "status": "pending | accepted | rejected",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Errors** `400 CANNOT_SEND_TO_SELF` · `404 USER_NOT_FOUND` · `400 FRIEND_REQUEST_ALREADY_EXISTS` · `400 FRIEND_REQUEST_CREATE_FAILED`

---

### `GET /api/friend-requests`
List incoming and outgoing friend requests.

**Response `200`**
```json
{
  "incoming": [ ],
  "outgoing": [ ]
}
```

---

### `PUT /api/friend-requests/:id/accept`
Accept a pending friend request. Only the recipient can accept.

**Response `200`** — friend request object with `status: "accepted"`

**Errors** `404 FRIEND_REQUEST_NOT_FOUND` · `400 NOT_RECIPIENT` · `400 FRIEND_REQUEST_NOT_PENDING` · `400 FRIEND_REQUEST_ACCEPT_FAILED`

---

### `PUT /api/friend-requests/:id/decline`
Decline a pending friend request. Only the recipient can decline.

**Response `200`** — friend request object with `status: "rejected"`

**Errors** `404 FRIEND_REQUEST_NOT_FOUND` · `400 NOT_RECIPIENT` · `400 FRIEND_REQUEST_NOT_PENDING` · `400 FRIEND_REQUEST_DECLINE_FAILED`

---

### `DELETE /api/friend-requests/:id`
Cancel a pending friend request. Only the sender can cancel.

**Response `200`** — deleted friend request object

**Errors** `404 FRIEND_REQUEST_NOT_FOUND` · `400 NOT_SENDER` · `400 FRIEND_REQUEST_NOT_PENDING` · `400 FRIEND_REQUEST_CANCEL_FAILED`
