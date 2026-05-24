import { useMemo } from "react";

import { formatMoney } from "@/shared/utils";
import { generateOrdersDataset } from "@/features/performance/utils/generate-orders-dataset";
import { buildOrdersAnalytics } from "@/features/analytics/utils";

import {
  OrdersByCityChart,
  OrdersByStatusChart,
  OrdersMap,
} from "@/features/analytics/components";

import "./analytics-page.scss";

const ORDERS_DATASET_SIZE = 50000;

export default function AnalyticsPage() {
  const orders = useMemo(() => {
    return generateOrdersDataset({
      size: ORDERS_DATASET_SIZE,
      seed: 1337,
    });
  }, []);

  const analytics = useMemo(() => {
    return buildOrdersAnalytics(orders);
  }, [orders]);

  return (
    <div className="analytics-page">
      <div className="analytics-page__header">
        <h1 className="analytics-page__title">Orders analytics</h1>

        <div className="analytics-page__subtitle">
          This page demonstrates data visualization with charts and map markers.
          Orders are generated as a deterministic dataset, aggregated by status
          and city, and displayed using third-party visualization tools.
        </div>
      </div>

      <div className="analytics-page__summary">
        <div className="analytics-page__summary-card">
          <div className="analytics-page__summary-label">Total orders</div>
          <div className="analytics-page__summary-value">
            {analytics.totalOrders}
          </div>
        </div>

        <div className="analytics-page__summary-card">
          <div className="analytics-page__summary-label">Total amount</div>
          <div className="analytics-page__summary-value">
            ${formatMoney(analytics.totalAmount)}
          </div>
        </div>

        <div className="analytics-page__summary-card">
          <div className="analytics-page__summary-label">Top city</div>
          <div className="analytics-page__summary-value">
            {analytics.topCity}
          </div>
        </div>
      </div>

      <div className="analytics-page__grid">
        <OrdersByStatusChart data={analytics.byStatus} />
        <OrdersByCityChart data={analytics.byCity} />
      </div>

      <OrdersMap data={analytics.byCity} />

      <div className="analytics-page__card">
        <div className="analytics-page__card-title">What this demonstrates</div>

        <div className="analytics-page__description">
          The page prepares raw orders data for visualization by aggregating
          orders by status and city. Charts help analyze distribution and total
          amount, while the map shows the geographic spread of orders using
          latitude and longitude.
        </div>
      </div>
    </div>
  );
}
