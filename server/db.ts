// Цей файл відповідає за підключення до бази даних PostgreSQL за допомогою бібліотеки pg.
// Він експортує об'єкт db, який є пулом з'єднань до бази даних.
// Параметри підключення беруться з змінної середовища DATABASE_URL, яка повинна містити рядок підключення до бази даних.
// Якщо ця змінна не встановлена, буде викинута помилка. Параметр ssl налаштований на rejectUnauthorized: false, що необхідно для роботи з Neon, оскільки він використовує безпечне з'єднання.
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = new Pool({
  connectionString,
  // Neon використовує безпечне з'єднання, тому нам потрібно налаштувати ssl з rejectUnauthorized: false,
  // щоб дозволити підключення до бази даних Neon без помилок сертифіката.
  ssl: {
    rejectUnauthorized: false, // Необхідно для роботи з Neon, оскільки він використовує безпечне з'єднання
  },
});

// ssl — потрібен, бо Neon працює через secure connection.
