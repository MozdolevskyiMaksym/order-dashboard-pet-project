import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { OrdersStatusChartPoint } from "../types";

type OrdersByStatusChartProps = Readonly<{
  data: ReadonlyArray<OrdersStatusChartPoint>;
}>;

const STATUS_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
];

export default function OrdersByStatusChart({
  data,
}: OrdersByStatusChartProps) {
  return (
    <div className="analytics-page__card">
      <div className="analytics-page__card-title">Orders by status</div>

      <div className="analytics-page__chart">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[...data]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Orders count">
              {data.map((item, index) => (
                <Cell
                  key={item.status}
                  fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
