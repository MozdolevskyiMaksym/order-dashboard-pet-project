import type { Order, OrderStatus } from "@/shared/types/order";

import randomInt from "./random-int";

export default function makeFakeOrder(id: string, status: OrderStatus): Order {
  return {
    id,
    createdAt: new Date(
      Date.now() - randomInt(0, 14) * 24 * 3600 * 1000,
    ).toISOString(),
    status,
    amount: randomInt(50, 3000),
    city: ["Kyiv", "Lviv", "Odesa", "Kharkiv", "Kremenchuk"][randomInt(0, 4)],
    lat: 49 + Math.random() * 2,
    lng: 30 + Math.random() * 5,
  };
}
