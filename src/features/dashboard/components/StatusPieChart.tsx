import React from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { StatusCountPoint } from "../selectors/aggregateByStatus";
import { STATUS_COLORS, STATUS_LABELS } from "@/features/orders/constants";
import type { OrderStatus } from "@/shared/types/order";

type Props = {
  data: ReadonlyArray<StatusCountPoint>;
  height?: number;
};

export function StatusPieChart({ data, height = 280 }: Readonly<Props>) {
  // Прибираємо нульові сегменти, щоб діаграма не була “порожньою”
  const filtered = data
    .filter((x) => x.count > 0)
    .map((entry) => ({
      ...entry,
      fill: STATUS_COLORS[entry.status] ?? "#8884d8",
    }));
  const total = filtered.reduce((acc, x) => acc + x.count, 0);

  if (!filtered.length) {
    return (
      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        No data available for display
      </div>
    );
  }

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Status Share</div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              // У Recharts типи для label не знають твою структуру,
              // тому беремо дані з props.payload і кастимо до нашого типу.
              label={(props) => {
                const payload = props.payload as unknown as
                  | StatusCountPoint
                  | undefined;
                if (!payload) return "";

                const label = STATUS_LABELS[payload.status] ?? payload.status;
                return `${label}: ${toPercent(payload.count, total)}`;
              }}
            />

            <Tooltip
              // Тут теж типи можуть бути “розмиті”, тому працюємо обережно
              formatter={(value, _name, item) => {
                const count = typeof value === "number" ? value : Number(value);
                const payload = (item?.payload ??
                  {}) as Partial<StatusCountPoint>;
                const label =
                  STATUS_LABELS[payload.status as OrderStatus] ??
                  payload.status ??
                  "status";
                return [`${count} (${toPercent(count, total)})`, label];
              }}
            />

            <Legend
              formatter={(value) =>
                STATUS_LABELS[String(value) as OrderStatus] ?? String(value)
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function toPercent(part: number, total: number): string {
  if (total === 0) {
    return "0%";
  }
  return `${Math.round((part / total) * 100)}%`;
}
