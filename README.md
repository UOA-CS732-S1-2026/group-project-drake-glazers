# Memoriez

Memoriez is a full-stack travel memory app built by **Drake Glazers** for **COMPSCI 732** at the University of Auckland.

The app lets users capture memories tied to real-world locations, attach media, control visibility, view memories on an interactive map, save memories into collections, manage friends, and receive memory anniversary notifications.

## Implemented Features

Memoriez implements the core user stories for recording, revisiting, and sharing travel memories:

- **Location-based memories:** Users can create memories tied to latitude and longitude coordinates, then visualise those memories as pins on an interactive Mapbox map.
- **Media attachments:** Users can attach media to memories, including photos and videos, so each memory can preserve more than just text.
- **Bulk photo uploads:** Users can select multiple photos when creating or updating memories, making it faster to record a trip or event.
- **Friend memories:** Users can search for other users, send and respond to friend requests, and view friends' memories according to each memory's visibility setting.
- **Memory anniversaries:** The app supports anniversary notifications so users can be reminded of memories from previous years.
- **Wishlist and saved collections:** Users can create named collections/lists of places and saved memories to revisit later.
- **Discovery and inspiration:** Users can explore public memories from other users for travel inspiration.
- **Privacy controls:** Users can mark memories as public, friends-only, or private.
- **Profile and social controls:** Users can manage their profile, friends, friend requests, and blocked users.

## Team

- Arnav Bhatiani
- Divyanshu Khadka
- Jerry Kim
- Harry Ma
- Oshan Premkumar
- Dhruv Sawant
- Milan Ahuja

## Project Links

- Repository: https://github.com/UOA-CS732-S1-2026/group-project-drake-glazers
- Project board: https://github.com/UOA-CS732-S1-2026/group-project-drake-glazers/projects
- Wiki: https://github.com/UOA-CS732-S1-2026/group-project-drake-glazers/wiki

## Tech Stack

- **Client:** React Native, Expo, Expo Router, NativeWind
- **Server:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma
- **Auth:** Clerk
- **Storage:** Supabase Storage
- **Maps:** Mapbox
- **Data fetching:** TanStack Query
- **State management:** Zustand
- **Testing:** Vitest, Supertest
- **CI:** GitHub Actions
- **Deployment:** Fly.io for the server

## Repository Structure

```text
.
|-- client/        # Expo React Native app
|-- server/        # Express API, Prisma schema, tests, jobs
|-- .github/       # CI workflows, issue templates
`-- README.md
```

## Prerequisites

Install the following before setup:

- Node.js 20 or newer
- npm
- Docker Desktop, required for local server tests
- Expo CLI through `npx expo`
- A Clerk project
- A Supabase project and storage bucket
- A Mapbox access token

For native mobile builds, also follow Expo's iOS/Android environment setup instructions.

## Quick Start

Install all root, client, and server dependencies:

```bash
npm run install:all
```

Then configure environment variables for both apps using the `.env.example` files.

## Client Setup

```bash
cd client
cp .env.example .env
npm install
```

Fill in `client/.env`:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=""
EXPO_PUBLIC_MAPBOX_TOKEN=""
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=""
```

Run the Expo app:

```bash
npm start
```

Useful client commands:

```bash
npm run ios
npm run android
npm run web
npm run lint
```

## Server Setup

```bash
cd server
cp .env.example .env
npm install
```

Fill in `server/.env`:

```bash
DATABASE_URL=""
DIRECT_URL=""
SHADOW_DATABASE_URL=""

CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
CLERK_WEBHOOK_SIGNING_SECRET=""

DEV_BYPASS_AUTH=""
CORS_ORIGINS="https://memoriezz.vercel.app,http://localhost:5173"

SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""

ANNIVERSARY_NOTIFICATION_HOUR=9
```

Do not commit real secrets. Use local `.env` files and GitHub/Fly secrets for deployed environments.

### Database and Prisma

Generate Prisma Client:

```bash
npx prisma generate
```

Apply existing migrations:

```bash
npx prisma migrate deploy
```

For local schema work, use Prisma's migration workflow:

```bash
npx prisma migrate dev
```

Run the API in development:

```bash
npm run dev
```

The server exposes:

```text
GET /health
```

Useful server commands:

```bash
npm run lint
npm run build
npm test
npm run anniversary:run
```

## Running Tests

Server tests use a local PostgreSQL container. Make sure Docker Desktop is running.

From the repository root:

```bash
npm test
```

The test script starts or reuses a local Postgres container, applies migrations, and runs Vitest.

## Environment Variables

Use these files as templates:

- `client/.env.example`
- `server/.env.example`

Guidelines:

- Keep secrets out of Git.
- Use Clerk dashboard values for Clerk keys.
- Use Supabase dashboard values for `SUPABASE_URL` and service role key.
- Use Mapbox dashboard values for Mapbox tokens.
- In production, `DATABASE_URL` may be a pooled connection and `DIRECT_URL` should be the direct database connection for Prisma migrations.
- In CI, local Postgres URLs can be used for both `DATABASE_URL` and `DIRECT_URL`.

## GitHub Project and Wiki

Use the GitHub Project board to track sprint work, task ownership, and PR status:

https://github.com/UOA-CS732-S1-2026/group-project-drake-glazers/projects

Use the wiki for project documentation, design notes, decisions, and marker-facing context:

https://github.com/UOA-CS732-S1-2026/group-project-drake-glazers/wiki

For development workflow, contribution guidelines, PR expectations, and additional project details, refer to the wiki.

## Deployment Notes

The server is configured for Fly.io from `server/fly.toml`.

Manual server deploy:

```bash
cd server
fly deploy
```

Fly secrets must be configured separately. Do not rely on local `.env` files in production.
