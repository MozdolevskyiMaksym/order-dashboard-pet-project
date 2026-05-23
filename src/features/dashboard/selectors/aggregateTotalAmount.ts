import type { Order } from "@/shared/types/order";

// Обчислює загальну суму замовлень.
export function aggregateTotalAmount(orders: ReadonlyArray<Order>): number {
  let total = 0;

  for (const order of orders) {
    total += order.amount;
  }

  return total;
}
