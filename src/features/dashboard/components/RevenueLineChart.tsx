import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { DateRevenuePoint } from "../selectors/aggregateRevenueByDay";
import { formatMoney } from "@/shared/utils";

type Props = {
  data: DateRevenuePoint[];
  height?: number;
};

// Форматуємо дату для осі X (з "YYYY-MM-DD" до "DD.MM")
function formatDayLabel(day: string): string {
  const [, m, d] = day.split("-");
  return `${d}.${m}`;
}

export function RevenueLineChart({ data, height = 280 }: Readonly<Props>) {
  // Якщо даних немає — показуємо простий стан
  if (!data.length) {
    return (
      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        No data available for display
      </div>
    );
  }

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Revenue by day</div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            {/* Вісь X показує дні */}
            <XAxis dataKey="date" tickFormatter={formatDayLabel} />

            {/* Вісь Y показує суму (число) */}
            <YAxis />

            {/* Tooltip показує детальні значення */}
            <Tooltip
              formatter={(value) =>
                typeof value === "number"
                  ? formatMoney(value, { locale: "uk-UA", currency: "UAH" })
                  : value
              }
              labelFormatter={(label) => `Date: ${label}`}
            />

            {/* Лінія доходу */}
            <Line
              type="monotone"
              dataKey="revenue"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
