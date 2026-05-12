import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

if (!datasourceUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL must be set for Prisma commands.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: datasourceUrl,
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
  migrations: {
    path: 'prisma/migrations',
  },
});
