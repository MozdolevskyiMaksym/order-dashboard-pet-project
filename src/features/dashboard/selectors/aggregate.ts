import type { Order, OrderStatus } from "@/shared/types/order";
import { formatIsoToDay } from "@/shared/utils";

export type OrdersFilter = {
  statuses?: ReadonlyArray<OrderStatus>;
  dateFrom?: string;
  dateTo?: string;
};

export function filterOrders(
  orders: ReadonlyArray<Order>,
  filter: OrdersFilter,
): Order[] {
  return orders.filter(({ createdAt, status }) => {
    const day = formatIsoToDay(createdAt);

    return (
      (!filter.statuses || filter.statuses.includes(status)) &&
      (!filter.dateFrom || day >= filter.dateFrom) &&
      (!filter.dateTo || day <= filter.dateTo)
    );
  });
}
