import React, { Suspense } from "react";
import type { Order } from "@/shared/types/order";

// Ліниве завантаження карти (важкий шматок UI)
const OrdersMap = React.lazy(() =>
  import("./OrdersMap").then((m) => ({ default: m.OrdersMap })),
);

type Props = {
  orders: Order[];
  height?: number;
};

export function OrdersMapLazy({ orders, height }: Readonly<Props>) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          Loading map…
        </div>
      }
    >
      <OrdersMap orders={orders} height={height} />
    </Suspense>
  );
}
