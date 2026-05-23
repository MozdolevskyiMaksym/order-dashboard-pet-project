import { http } from "./http";
import type { Order, OrderStatus } from "@/shared/types/order";

type GetOrdersQuery = {
  statuses?: OrderStatus[];
};
type CreateOrderDto = Omit<Order, "id">;

export function getOrders(query: GetOrdersQuery = {}): Promise<Order[]> {
  const params = new URLSearchParams(); // Це вбудований Web API, який надається браузером

  // Якщо в query є масив статусів, ми додаємо кожен статус як окремий параметр status у URL
  if (query.statuses) {
    for (const status of query.statuses) {
      params.append("status", status);
    }
  }

  const queryString = params.toString(); // Генерує рядок запиту, наприклад: "status=new&status=completed"
  const url = queryString ? `/api/orders?${queryString}` : "/api/orders";
  return http<Order[]>(url);
}

export function createOrder(dto: CreateOrderDto): Promise<Order> {
  return http<Order, CreateOrderDto>("/api/orders", {
    method: "POST",
    body: dto,
  });
}
