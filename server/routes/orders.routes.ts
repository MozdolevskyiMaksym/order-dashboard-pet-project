import type { Router } from "express";
import type { OrderStatus } from "@/shared/types/order";
import { createOrder, listOrders } from "../store/orders.store";
import { validateCreateOrderDto } from "../validators/orders.validators";

export function registerOrdersRoutes(router: Router) {
  // GET /api/orders?status=new&status=completed
  // Цей endpoint повертає список orders.
  // Якщо передані query params status, тоді повертаємо тільки orders з потрібними статусами.
  router.get("/orders", async (req, res, next) => {
    try {
      const status = req.query.status;
      // Якщо прийшло з фронта /api/orders?status=new&status=completed
      // тоді Express зробить:
      // req.query = {
      //   status: ["new", "completed"]
      // }
      //
      // Якщо прийшло /api/orders?status=new
      // тоді Express зробить:
      // req.query = {
      //   status: "new"
      // }

      let statuses: OrderStatus[] | undefined;

      if (status) {
        // Приводимо status до масиву.
        // Це потрібно, бо Express може повернути або string, або array.
        const rawStatuses = Array.isArray(status) ? status : [status];

        // Фільтруємо масив статусів, залишаючи тільки валідні значення,
        // які відповідають типу OrderStatus.
        statuses = rawStatuses.filter(
          (status): status is OrderStatus =>
            status === "new" ||
            status === "processing" ||
            status === "completed" ||
            status === "cancelled",
        );
      }

      // listOrders тепер async, бо читає orders з PostgreSQL.
      // Тому тут потрібно використовувати await.
      const orders = await listOrders({ statuses });

      // Відправляємо orders на frontend у JSON форматі.
      res.json(orders);
    } catch (error) {
      // Якщо під час роботи з database сталася помилка,
      // передаємо її в Express error handler.
      next(error);
    }
  });

  // POST /api/orders
  // Цей endpoint створює новий order.
  // Frontend відправляє body з даними нового order.
  router.post("/orders", async (req, res, next) => {
    try {
      // validateCreateOrderDto перевіряє, що в req.body є всі необхідні поля
      // для створення замовлення.
      //
      // DTO = Data Transfer Object.
      // Це об'єкт, який прийшов з frontend у тілі HTTP-запиту.
      const dto = validateCreateOrderDto(req.body);

      if (!dto) {
        // Якщо body невалідний, повертаємо 400 Bad Request.
        return res.status(400).json({ error: "Invalid payload" });
      }

      // createOrder тепер async, бо записує новий order у PostgreSQL.
      // Тому тут також використовуємо await.
      const created = await createOrder(dto);

      // Якщо order успішно створений, повертаємо 201 Created
      // і сам створений order.
      return res.status(201).json(created);
    } catch (error) {
      // Якщо сталася помилка під час insert у database,
      // передаємо її в Express error handler.
      return next(error);
    }
  });
}
