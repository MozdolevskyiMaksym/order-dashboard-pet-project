import React, { useMemo } from "react";

function expensiveComputation(limit: number): number {
  // ✅ Імітуємо “важку” логіку, щоб було видно сенс окремого chunk
  let acc = 0;
  for (let i = 0; i < limit; i += 1) {
    acc += i % 7;
  }
  return acc;
}

export default function Heavy() {
  // ✅ useMemo щоб не рахувати заново на кожен ререндер
  const value = useMemo(() => expensiveComputation(12_000_000), []);

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Heavy module</div>
      <div>Результат обчислення: {value}</div>
      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
        Цей компонент завантажується ліниво як окремий chunk.
      </div>
    </div>
  );
}
