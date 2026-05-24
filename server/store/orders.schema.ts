import { db } from "../db";
import { mockedOrders } from "./mockedOrders";

export async function initOrdersTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      city TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL
    );
  `);

  await seedOrdersIfEmpty();
}

async function seedOrdersIfEmpty() {
  const result = await db.query<{ count: string }>(`
    SELECT COUNT(*) AS count FROM orders;
  `);

  const count = Number(result.rows[0]?.count ?? 0);

  if (count > 0) {
    return;
  }

  for (const order of mockedOrders) {
    await db.query(
      `
        INSERT INTO orders (
          id,
          created_at,
          status,
          amount,
          city,
          lat,
          lng
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `,
      [
        order.id,
        order.createdAt,
        order.status,
        order.amount,
        order.city,
        order.lat,
        order.lng,
      ],
    );
  }

  console.log(`[database] seeded ${mockedOrders.length} orders`);
}