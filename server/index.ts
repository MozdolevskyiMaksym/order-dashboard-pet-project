// Підключаємо змінні середовища з файлу .env
// Наприклад: PORT=4000, API_TOKEN=secret123, DATABASE_URL=postgresql://...
import "dotenv/config";

import { createApp } from "./app";
import { initOrdersTable } from "./store/orders.schema";

// Беремо порт із змінних середовища.
// Якщо PORT не заданий — використовуємо 4000 за замовчуванням.
const port = Number(process.env.PORT ?? 4000);

async function bootstrap() {
  // Перед запуском HTTP-сервера ініціалізуємо таблицю orders у PostgreSQL.
  // Якщо таблиця вже існує, CREATE TABLE IF NOT EXISTS нічого не зламає.
  await initOrdersTable();

  // Створюємо екземпляр Express-додатку
  // (в createApp() налаштовані middleware, маршрути, CORS і т.д.)
  const app = createApp();

  // Запускаємо HTTP-сервер і починаємо "слухати" запити на вказаному порту.
  // Після цього сервер готовий приймати мережеві запити (GET, POST і т.д.)
  app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[server] failed to start", error);
  process.exit(1);
});

// У цьому файлі я ініціалізую HTTP-сервер.
// Я підключаю змінні середовища через dotenv, створюю Express-додаток через createApp,
// де налаштовані маршрути та middleware, і запускаю сервер на вказаному порту.
//
// Після інтеграції cloud database сервер перед стартом також ініціалізує таблицю orders.
// Це потрібно, щоб backend міг зберігати і читати orders з PostgreSQL, а не з in-memory store.
// Якщо підключення до database або створення таблиці не вдасться, сервер не стартує,
// і помилка буде явно показана в логах.
