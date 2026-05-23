import type { Order } from "@/shared/types/order";
import type { OrdersSort } from "../types";

// Сортування із контрольованим напрямком
// Не мутує вихідний масив
export function sortOrders(
  orders: ReadonlyArray<Order>,
  sort: OrdersSort,
): Order[] {
  const dir = sort.direction === "asc" ? 1 : -1;

  return [...orders].sort((o1, o2) => {
    let a: string | number;
    let b: string | number;

    if (sort.key === "createdAt") {
      a = new Date(o1.createdAt).getTime();
      b = new Date(o2.createdAt).getTime();
    } else if (sort.key === "amount") {
      a = o1.amount;
      b = o2.amount;
    } else if (sort.key === "status") {
      a = o1.status;
      b = o2.status;
    } else {
      a = o1.city;
      b = o2.city;
    }

    return compare(a, b) * dir;
  });
}

function compare(a: string | number, b: string | number) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
