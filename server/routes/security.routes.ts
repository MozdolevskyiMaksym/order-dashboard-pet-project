import type { Router } from "express";
import { requireAuth } from "../auth";

export function registerSecurityRoutes(router: Router) {
  // GET /api/public
  router.get("/public", (_req, res) => {
    res.json({
      ok: true,
      message: "Public endpoint: no auth required",
    });
  });

  // GET /api/secure/profile

  // requireAuth - це middleware, який перевіряє наявність і правильність токена в заголовку Authorization.
  // Якщо токен відсутній або неправильний, він повертає 401 Unauthorized.
  // Якщо токен правильний, він викликає next(), і запит обробляється наступним обробником,
  // який повертає дані профілю користувача.
  router.get("/secure/profile", requireAuth, (_req, res) => {
    res.json({
      ok: true,
      user: {
        id: "demo-user",
        role: "admin",
      },
    });
  });
}
