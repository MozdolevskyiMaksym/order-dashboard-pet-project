// Підключаємо змінні середовища з файлу .env
// Наприклад: PORT=4000, API_TOKEN=secret123
import "dotenv/config";

import { createApp } from "./app";

// Створюємо екземпляр Express-додатку
// (в createApp() налаштовані middleware, маршрути, CORS і т.д.)
const app = createApp();

// Беремо порт із змінних середовища.
// Якщо PORT не заданий — використовуємо 4000 за замовчуванням.
const port = Number(process.env.PORT ?? 4000);

// Запускаємо HTTP-сервер і починаємо "слухати" запити на вказаному порту.
// Після цього сервер готовий приймати мережеві запити (GET, POST і т.д.)
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});

// У цьому файлі я ініціалізую HTTP-сервер.
// Я підключаю змінні середовища через dotenv, створюю Express-додаток через createApp,
// де налаштовані маршрути та middleware, і запускаю сервер на вказаному порту.
// Після виклику app.listen сервер починає обробляти HTTP-запити від клієнта.
