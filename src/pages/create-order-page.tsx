import { JSX, useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/shared/types/order";
import { createOrder, getOrders } from "@/api/orders.api";

import { CreateOrderForm } from "@/features/dashboard/components/create-order-form";
import { aggregateByStatus } from "@/features/dashboard/selectors/aggregateByStatus";
import { StatusBarChart } from "@/features/dashboard/components/StatusBarChart";
import { StatusPieChart } from "@/features/dashboard/components/StatusPieChart";

import { ALL_STATUSES } from "@/features/orders/constants";

import "./create-order-page.scss";

export default function CreateOrderPage() {
  const [orders, setOrders] = useState<ReadonlyArray<Order>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshOrders() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getOrders({ statuses: [...ALL_STATUSES] });
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshOrders();
  }, []);

  async function handleCreate(
    dto: Readonly<{
      status: OrderStatus;
      amount: number;
      city: string;
      lat: number;
      lng: number;
    }>,
  ) {
    await createOrder({
      ...dto,
      createdAt: new Date().toISOString(),
    });

    await refreshOrders();
  }

  const statusData = useMemo(() => {
    return aggregateByStatus(orders);
  }, [orders]);

  const renderPreview = (): JSX.Element => {
    if (isLoading) {
      return <div className="create-order-page__loading">Loading preview…</div>;
    }

    if (error) {
      return <div className="create-order-page__error">Error: {error}</div>;
    }

    return (
      <>
        <StatusBarChart data={statusData} />
        <StatusPieChart data={statusData} />
      </>
    );
  };

  return (
    <div className="create-order-page">
      <h1 className="create-order-page__title">Create order</h1>

      <div className="create-order-page__layout">
        <CreateOrderForm onCreate={handleCreate} />

        <div className="create-order-page__preview">{renderPreview()}</div>
      </div>
    </div>
  );
}
