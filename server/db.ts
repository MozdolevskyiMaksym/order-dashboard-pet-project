import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Pool — PostgreSQL connection pool.
// DATABASE_URL — connection string з Neon.
// ssl — потрібен, бо Neon працює через secure connection.