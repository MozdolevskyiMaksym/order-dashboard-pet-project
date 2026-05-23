import type { Order, OrderStatus } from "@/shared/types/order";

export type StatusCountPoint = {
  status: OrderStatus;
  count: number;
};

// Групує замовлення за статусом.
// Використовує Map для керування колекцією.
export function aggregateByStatus(
  orders: ReadonlyArray<Order>,
): StatusCountPoint[] {
  const map = new Map<OrderStatus, number>();

  for (const order of orders) {
    map.set(order.status, (map.get(order.status) ?? 0) + 1);
  }

  const statuses: ReadonlyArray<OrderStatus> = [
    "new",
    "processing",
    "completed",
    "cancelled",
  ];

  return statuses.map((status) => ({
    status,
    count: map.get(status) ?? 0,
  }));
}
