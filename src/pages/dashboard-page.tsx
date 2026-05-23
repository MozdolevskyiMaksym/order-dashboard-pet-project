import { JSX, useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/shared/types/order";
import { getOrders } from "@/api/orders.api";

import { aggregateRevenueByDay } from "@/features/dashboard/selectors/aggregateRevenueByDay";
import { aggregateByStatus } from "@/features/dashboard/selectors/aggregateByStatus";
import { aggregateByCity } from "@/features/dashboard/selectors/aggregateByCity";
import { aggregateTotalAmount } from "@/features/dashboard/selectors/aggregateTotalAmount";
import { indexOrdersById } from "@/features/dashboard/selectors/indexOrdersById";

import { RevenueLineChart } from "@/features/dashboard/components/RevenueLineChart";
import { StatusBarChart } from "@/features/dashboard/components/StatusBarChart";
import { StatusPieChart } from "@/features/dashboard/components/StatusPieChart";
import "./dashboard-page.scss";

const ALL_STATUSES: ReadonlyArray<OrderStatus> = [
  "new",
  "processing",
  "completed",
  "cancelled",
];

export default function DashboardPage() {
  const [orders, setOrders] = useState<ReadonlyArray<Order>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getOrders({ statuses: [...ALL_STATUSES] });
        if (alive) {
          setOrders(data);
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, []);

  const revenueByDay = useMemo(() => {
    return aggregateRevenueByDay(orders);
  }, [orders]);

  const countByStatus = useMemo(() => {
    return aggregateByStatus(orders);
  }, [orders]);

  const cities = useMemo(() => {
    return aggregateByCity(orders);
  }, [orders]);

  const totalAmount = useMemo(() => {
    return aggregateTotalAmount(orders);
  }, [orders]);

  const ordersById = useMemo(() => {
    return indexOrdersById(orders);
  }, [orders]);

  const renderContent = (): JSX.Element => {
    if (isLoading) {
      return <div className="dashboard-page__loading">Loading…</div>;
    }

    if (error) {
      return <div className="dashboard-page__error">Error: {error}</div>;
    }

    return (
      <>
        <div className="dashboard-page__summary">
          <div>Total amount: {totalAmount}</div>
          <div>Total orders: {orders.length}</div>
          <div>Index size: {ordersById.size}</div>
          <div>Top city: {cities[0]?.city ?? "N/A"}</div>
        </div>

        <RevenueLineChart data={revenueByDay} />
        <StatusBarChart data={countByStatus} />
        <StatusPieChart data={countByStatus} />
      </>
    );
  };

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Dashboard</h1>
      {renderContent()}
    </div>
  );
}
