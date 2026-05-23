import type { Order } from '@/shared/types/order';
import { STATUS_LABELS } from '@/features/orders/constants';

import type {
  OrdersAnalytics,
  OrdersCityChartPoint,
  OrdersStatusChartPoint,
} from '../types';

export function buildOrdersAnalytics(
  orders: ReadonlyArray<Order>,
): OrdersAnalytics {
  const statusMap = new Map<string, number>();
  const cityMap = new Map<
    string,
    {
      count: number;
      totalAmount: number;
      lat: number;
      lng: number;
    }
  >();

  let totalAmount = 0;

  for (const order of orders) {
    totalAmount += order.amount;

    const statusLabel = STATUS_LABELS[order.status] ?? order.status;
    statusMap.set(statusLabel, (statusMap.get(statusLabel) ?? 0) + 1);

    const currentCity = cityMap.get(order.city);

    if (currentCity) {
      cityMap.set(order.city, {
        ...currentCity,
        count: currentCity.count + 1,
        totalAmount: currentCity.totalAmount + order.amount,
      });
    } else {
      cityMap.set(order.city, {
        count: 1,
        totalAmount: order.amount,
        lat: order.lat,
        lng: order.lng,
      });
    }
  }

  const byStatus: OrdersStatusChartPoint[] = Array.from(statusMap).map(
    ([status, count]) => ({
      status,
      count,
    }),
  );

  const byCity: OrdersCityChartPoint[] = Array.from(cityMap).map(
    ([city, data]) => ({
      city,
      count: data.count,
      totalAmount: data.totalAmount,
      lat: data.lat,
      lng: data.lng,
    }),
  );

  const topCity =
    [...byCity].sort((a, b) => b.count - a.count)[0]?.city ?? 'N/A';

  return {
    totalOrders: orders.length,
    totalAmount,
    topCity,
    byStatus,
    byCity,
  };
}
