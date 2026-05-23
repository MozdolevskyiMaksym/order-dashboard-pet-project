import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { StatusCountPoint } from "../selectors/aggregateByStatus";
import { STATUS_COLORS, STATUS_LABELS } from "@/features/orders/constants";
import { OrderStatus } from "@/shared/types/order";

type Props = {
  data: ReadonlyArray<StatusCountPoint>;
  height?: number;
};

export function StatusBarChart({ data, height = 260 }: Readonly<Props>) {
  const chartData = data.map((entry) => ({
    ...entry,
    fill: STATUS_COLORS[entry.status] ?? "#8884d8",
  }));

  if (!data.length) {
    return (
      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        No data available for display
      </div>
    );
  }

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Number of orders by status
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="status"
              tickFormatter={(status) =>
                STATUS_LABELS[String(status) as OrderStatus] ?? String(status)
              }
            />

            <YAxis allowDecimals={false} />

            <Tooltip
              formatter={(value) => [`${value}`, "Count"]}
              labelFormatter={(label) => {
                const status = String(label) as OrderStatus;
                return `Status: ${STATUS_LABELS[status] ?? String(label)}`;
              }}
            />

            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
