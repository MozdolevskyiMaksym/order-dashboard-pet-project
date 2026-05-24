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

import { formatMoney } from "@/shared/utils";

import type { OrdersCityChartPoint } from "../types";

type OrdersByCityChartProps = Readonly<{
  data: ReadonlyArray<OrdersCityChartPoint>;
}>;

const CITY_COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#84cc16",
  "#f97316",
];

export default function OrdersByCityChart({ data }: OrdersByCityChartProps) {
  return (
    <div className="analytics-page__card">
      <div className="analytics-page__card-title">Orders amount by city</div>

      <div className="analytics-page__chart">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[...data]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="city" />
            <YAxis />
            <Tooltip
              formatter={(value) => [
                `$${formatMoney(Number(value))}`,
                "Total amount",
              ]}
            />
            <Bar dataKey="totalAmount" name="Total amount">
              {data.map((item, index) => (
                <Cell
                  key={item.city}
                  fill={CITY_COLORS[index % CITY_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
