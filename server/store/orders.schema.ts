import { db } from "../db";
// import { mockedOrders } from "./mockedOrders";

// Цей файл відповідає за ініціалізацію таблиці orders у базі даних PostgreSQL та її заповнення тестовими даними, якщо вона порожня.
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
  // Після створення таблиці перевіряємо, чи вона порожня, і якщо так, то заповнюємо її тестовими даними з mockedOrders.
  await seedOrdersIfEmpty();
}

async function seedOrdersIfEmpty() {
  // Виконуємо SQL-запит для підрахунку кількості записів у таблиці orders.
  // Якщо кількість більша за 0, то таблиця не порожня і ми не будемо її заповнювати.
  const result = await db.query<{ count: string }>(`
    SELECT COUNT(*) AS count FROM orders;
  `);

  const count = Number(result.rows[0]?.count ?? 0);

  if (count > 0) {
    return;
  }

  // Якщо таблиця порожня, то ми проходимося по масиву mockedOrders і вставляємо кожен замовлення у таблицю orders за допомогою SQL-запиту INSERT INTO.
  // for (const order of mockedOrders) {
  //   await db.query(
  //     `
  //       INSERT INTO orders (
  //         id,
  //         created_at,
  //         status,
  //         amount,
  //         city,
  //         lat,
  //         lng
  //       )
  //       VALUES ($1, $2, $3, $4, $5, $6, $7);
  //     `,
  //     [
  //       order.id,
  //       order.createdAt,
  //       order.status,
  //       order.amount,
  //       order.city,
  //       order.lat,
  //       order.lng,
  //     ],
  //   );
  // }
}
