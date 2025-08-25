import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable must be set');
}

// Create the connection
const client = postgres(DATABASE_URL);

// Create drizzle db instance
export const db = drizzle(client, { schema });

export default db;