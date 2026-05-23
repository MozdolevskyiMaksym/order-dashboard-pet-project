import type { Request, Response, NextFunction } from "express";

// middleware для захисту приватних маршрутів
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = parseBearerToken(req.header("authorization")); // отримуємо токен з заголовка Authorization, якщо він там є
  const expectedToken = process.env.API_TOKEN; // очікуване значення токена, яке має бути встановлено в змінних оточення сервера (наприклад, через .env файл)

  if (!expectedToken) {
    return res.status(500).json({ error: "Server auth is not configured" });
  }

  if (!token || token !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

function parseBearerToken(value: string | undefined) {
  // Якщо заголовок відсутній або не має значення, повертаємо null, що означає відсутність токена
  if (!value) {
    return null;
  }

  const prefix = "Bearer ";
  // Якщо значення не починається з "Bearer ", це означає, що токен не передано у правильному форматі, тому ми також повертаємо null
  if (!value.startsWith(prefix)) {
    return null;
  }

  // Вирізаємо префікс "Bearer " і отримуємо сам токен.
  // Також виконуємо trim(), щоб видалити можливі зайві пробіли на початку або в кінці токена.
  const token = value.slice(prefix.length).trim();
  if (!token) {
    return null;
  }

  return token;
}
