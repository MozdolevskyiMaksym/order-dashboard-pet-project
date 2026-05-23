import type { Router } from "express";
import type { OrderStatus } from "@/shared/types/order";
import { createOrder, listOrders } from "../store/orders.store";
import { validateCreateOrderDto } from "../validators/orders.validators";

export function registerOrdersRoutes(router: Router) {
  // GET /api/orders?status=new&status=completed
  router.get("/orders", (req, res) => {
    const status = req.query.status;
    // Якщо прийшло з фронта /api/orders?status=new&status=completed
    // тоді Express зробить
    // req.query = {
    //   status: ["new", "completed"]
    // }

    // якщо прийшло /api/orders?status=new
    // тоді Express зробить
    // req.query = {
    //   status: "new"
    // }

    let statuses: OrderStatus[] | undefined;
    if (status) {
      const rawStatuses = Array.isArray(status) ? status : [status];
      // фільтруємо масив статусів, залишаючи тільки валідні значення, які відповідають типу OrderStatus
      statuses = rawStatuses.filter(
        (status): status is OrderStatus =>
          status === "new" ||
          status === "processing" ||
          status === "completed" ||
          status === "cancelled",
      );
    }

    res.json(listOrders({ statuses }));
  });

  // POST /api/orders
  router.post("/orders", (req, res) => {
    // validateCreateOrderDto перевіряє, що в req.body є всі необхідні поля для створення замовлення,
    const dto = validateCreateOrderDto(req.body); // dataTransferObject - об'єкт, який прийшов з фронта в тілі запиту

    if (!dto) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    // Якщо дані валідні, ми викликаємо createOrder, який створює нове замовлення і повертає його.
    const created = createOrder(dto);
    return res.status(201).json(created);
  });
}
