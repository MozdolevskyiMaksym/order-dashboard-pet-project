import type { Order, OrderStatus } from "@/shared/types/order";
import { db } from "../db";

type OrderRow = Readonly<{
  id: string;
  created_at: string;
  status: OrderStatus;
  amount: string;
  city: string;
  lat: number;
  lng: number;
}>;

export async function listOrders(filter?: {
  statuses?: OrderStatus[];
}): Promise<Order[]> {
  if (!filter?.statuses?.length) {
    const result = await db.query<OrderRow>(`
      SELECT
        id,
        created_at,
        status,
        amount,
        city,
        lat,
        lng
      FROM orders
      ORDER BY created_at ASC;
    `);

    return result.rows.map(mapOrderRow);
  }

  const result = await db.query<OrderRow>(
    `
      SELECT
        id,
        created_at,
        status,
        amount,
        city,
        lat,
        lng
      FROM orders
      WHERE status = ANY($1::text[])
      ORDER BY created_at ASC;
    `,
    [filter.statuses],
  );

  return result.rows.map(mapOrderRow);
}

export async function createOrder(input: Omit<Order, "id">): Promise<Order> {
  const order: Order = {
    ...input,
    id: generateId(),
  };

  const result = await db.query<OrderRow>(
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
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        created_at,
        status,
        amount,
        city,
        lat,
        lng;
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

  return mapOrderRow(result.rows[0]);
}

function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    amount: Number(row.amount),
    city: row.city,
    lat: row.lat,
    lng: row.lng,
  };
}

function generateId() {
  return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
}