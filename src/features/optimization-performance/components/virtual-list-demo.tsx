import { useMemo, useState } from "react";
import type { Logger } from "../types";
import VirtualList from "./virtual-list";

import "./virtual-list-demo.scss";

type Row = Readonly<{
  id: string;
  title: string;
  amount: number;
}>;

// Генерує масив рядків з унікальними id, заголовком та сумою для демонстрації віртуалізації списку
function makeRows(count: number): ReadonlyArray<Row> {
  const out: Row[] = [];

  for (let i = 0; i < count; i += 1) {
    out.push({
      id: `row_${i + 1}`,
      title: `Order #${(i + 1).toString().padStart(5, "0")}`,
      amount: Math.round(10 + ((i * 17) % 9000)),
    });
  }

  return out;
}

export default function VirtualListDemo({
  logger,
}: Readonly<{ logger: Logger }>) {
  const [count, setCount] = useState(12000);
  const [mode, setMode] = useState<"naive" | "virtual">("naive");

  const rows = useMemo(() => makeRows(count), [count]);

  const renderRow = ({ title, amount }: Row) => {
    return (
      <div className="virtual-list-demo__row-item">
        <div>{title}</div>
        <div className="virtual-list-demo__kbd">{amount}</div>
      </div>
    );
  };

  const handleToggleMode = () => {
    const t0 = performance.now();

    setMode((p) => (p === "naive" ? "virtual" : "naive"));

    const t1 = performance.now();
    const ms = t1 - t0;

    logger.info(`VirtualListDemo: toggled mode in ${ms.toFixed(2)} ms`);
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = Number(e.target.value);

    if (Number.isFinite(number)) {
      const count = Math.max(1000, Math.min(60000, Math.floor(number)));
      setCount(count);
      logger.info(`VirtualListDemo: count=${count.toLocaleString()}`);
    }
  };

  return (
    <div className="virtual-list-demo">
      <div className="virtual-list-demo__row">
        <button
          type="button"
          className="virtual-list-demo__btn virtual-list-demo__btn--primary"
          onClick={handleToggleMode}
        >
          Toggle: {mode === "naive" ? "Naive" : "Virtualized"}
        </button>

        <input
          className="virtual-list-demo__input"
          value={String(count)}
          inputMode="numeric"
          onChange={handleCountChange}
        />

        <div className="virtual-list-demo__hint">
          Try 20k-60k in naive mode to feel the difference.
        </div>
      </div>

      <div className="virtual-list-demo__metrics">
        <div className="virtual-list-demo__metric">
          <div className="virtual-list-demo__metric-label">Rows</div>
          <div className="virtual-list-demo__metric-value">
            {rows.length.toLocaleString()}
          </div>
        </div>

        <div className="virtual-list-demo__metric">
          <div className="virtual-list-demo__metric-label">Mode</div>
          <div className="virtual-list-demo__metric-value">{mode}</div>
        </div>
      </div>

      {mode === "naive" ? (
        // Виводимо весь список рядків без оптимізації, що може призвести до поганої продуктивності при великій кількості елементів
        <div className="virtual-list-demo__list">
          {rows.map((row) => (
            <div key={row.id} className="virtual-list-demo__naive-row">
              {renderRow(row)}
            </div>
          ))}
        </div>
      ) : (
        // Виводимо віртуалізований список, який рендерить лише видимі елементи,
        // що значно покращує продуктивність при великій кількості рядків
        <VirtualList
          className="virtual-list-demo__list"
          items={rows}
          rowHeight={34}
          overscan={8}
          renderRow={renderRow}
        />
      )}
    </div>
  );
}
