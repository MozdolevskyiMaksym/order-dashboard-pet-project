import type { Order, OrderStatus } from "@/shared/types/order";
import { mockedOrders } from "./mockedOrders";

// In-memory "база" для pet-проєкту
const orders = [...mockedOrders];

export function listOrders(filter?: { statuses?: OrderStatus[] }) {
  if (!filter?.statuses?.length) {
    return orders;
  }

  return orders.filter((order) => filter.statuses?.includes(order.status));
}

export function createOrder(input: Omit<Order, "id">) {
  const order: Order = {
    ...input,
    id: generateId(),
  };

  orders.push(order);
  return order;
}

function generateId() {
  return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
}
