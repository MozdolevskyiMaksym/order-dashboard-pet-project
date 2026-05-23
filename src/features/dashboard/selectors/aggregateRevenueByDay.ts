import type { Order } from "@/shared/types/order";
import { formatIsoToDay } from "@/shared/utils";

export type DateRevenuePoint = {
  date: string; // YYYY-MM-DD
  revenue: number;
};

// Revenue по днях (для LineChart)
export function aggregateRevenueByDay(
  orders: ReadonlyArray<Order>,
): DateRevenuePoint[] {
  const map = new Map<string, number>();

  for (const order of orders) {
    const day = formatIsoToDay(order.createdAt);
    const prev = map.get(day) ?? 0;
    map.set(day, prev + order.amount);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({
      date,
      revenue,
    }));
}
