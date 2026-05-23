import { formatMs } from "@/shared/utils";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PerfPoint } from "../types";

import "./performance-comparison-line-chart.scss";

interface Props {
  data: ReadonlyArray<PerfPoint>;
}

export function PerformanceComparisonLineChart({ data }: Readonly<Props>) {
  return (
    <div className="performance-comparison-line-chart">
      <div className="performance-comparison-line-chart__title">
        Naive vs Optimized (ms) by dataset size
      </div>

      <div className="performance-comparison-line-chart__canvas">
        <ResponsiveContainer>
          <LineChart data={[...data]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="size"
              tickFormatter={(v) => `${Number(v).toLocaleString()}`}
            />
            <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}`} />
            <Tooltip
              formatter={(value) => formatMs(value as number, 2)}
              labelFormatter={(label) =>
                `Size: ${Number(label).toLocaleString()}`
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="naiveMs"
              name="Naive"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="optimizedMs"
              name="Optimized"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="performance-comparison-line-chart__note">
        Чим більший датасет — тим сильніше видно різницю між O(n*m) (includes)
        та ~O(n) з Set/Map.
      </div>
    </div>
  );
}
