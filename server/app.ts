import express, { Router } from "express";
import cors from "cors";
import { registerHealthRoutes } from "./routes/health.routes";
import { registerOrdersRoutes } from "./routes/orders.routes";
import { registerSecurityRoutes } from "./routes/security.routes";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://order-dashboard-pet-project.vercel.app",
]);

// По суті App - це сервер
export function createApp() {
  const app = express(); // Створює екземпляр веб-сервера. Створюється HTTP-додаток, який може обробляти запити,
  // визначати маршрути, використовувати middleware і т.д.

  // Парсер JSON для body
  // Middleware, який читає JSON з тіла HTTP-запиту (request body)
  // Наприклад, коли фронт робить POST /api/orders і відправляє JSON:
  // { "status": "...", "amount": 123, ... }
  // Без express.json() req.body буде undefined.
  app.use(express.json());

  // CORS не обовʼязковий при proxy, але не заважає для локального тесту
  // CORS — це правила браузера, які обмежують запити між різними “origin” (домен/порт).
  // Наприклад: фронт http://localhost:3000, бек http://localhost:4000 — це різні origin

  // CORS middleware дозволяє браузеру виконувати запити до цього бекенда з іншого origin
  // (наприклад, коли frontend і backend працюють на різних хостах або портах).

  // У development я використовую dev-proxy (3000 -> 4000), тому CORS фактично не спрацьовує,
  // але він залишається корисним для:
  // - прямого тестування бекенда без proxy - тобто якщо ми відкриємо http://localhost:4000 і спробуємо зробити запит з консолі браузера,
  // CORS дозволить це зробити. Або просто напярму зробимо фетч - production-сценарію, де frontend і backend можуть бути на різних доменах
  // app.use(
  //   cors({
  //     origin: true, // дозволяє запити з будь-якого origin (відповідає конкретним origin, що прийшов)
  //     credentials: true, // дозволяє передавати “credentials”: cookies, authorization, client certificates
  //   }),
  // );

  app.use(
    cors({
      origin(origin, callback) {
        // Якщо origin відсутній (наприклад, при запитах з Postman або curl) або він є в списку дозволених, то дозволяємо запит
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        // Інакше відхиляємо запит з помилкою CORS
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );

  // Всі API маршрути під /api
  // Створюємо окремий Router для API.
  // Це зручно: всі бекенд-ендпоїнти будуть "під" /api.
  const api = Router();

  // Реєструємо ендпоїнти "перевірки живості" сервера.
  // Усередині registerHealthRoutes робиться api.get("/health", ...)
  registerHealthRoutes(api);

  // Реєструємо ендпоїнти для роботи із замовленнями.
  // Усередині registerOrdersRoutes робиться api.get("/orders", ...) і api.post("/orders", ...)
  registerOrdersRoutes(api);
  // Реєструємо ендпоїнти для роботи з безпекою.
  // Усередині registerSecurityRoutes робиться api.get("/security", ...) і api.post("/security", ...)
  registerSecurityRoutes(api);

  // Монтуємо Router на шлях /api.
  // Це означає:
  // - api.get("/health") стане доступним як GET /api/health
  // - api.get("/orders") стане доступним як GET /api/orders
  // - api.post("/orders") стане доступним як POST /api/orders
  app.use("/api", api);

  return app;
}
