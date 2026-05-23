import type { Order } from "@/shared/types/order";

export type CityCountPoint = {
  city: string;
  count: number;
};

// Агрегація замовлень за містом.
export function aggregateByCity(
  orders: ReadonlyArray<Order>,
): CityCountPoint[] {
  const map = new Map<string, number>();

  for (const order of orders) {
    map.set(order.city, (map.get(order.city) ?? 0) + 1);
  }

  return Array.from(map, ([city, count]) => ({ city, count })).sort((a, b) => {
    if (a.count > b.count) {
      return -1;
    }

    if (a.count < b.count) {
      return 1;
    }

    return a.city.localeCompare(b.city);
  });
}
