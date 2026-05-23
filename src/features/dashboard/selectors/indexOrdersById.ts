import type { Order } from "@/shared/types/order";

// Створює індекс замовлень за id для швидкого доступу.
export function indexOrdersById(
  orders: ReadonlyArray<Order>,
): ReadonlyMap<string, Order> {
  const map = new Map<string, Order>();

  for (const order of orders) {
    map.set(order.id, order);
  }

  return map;
}
