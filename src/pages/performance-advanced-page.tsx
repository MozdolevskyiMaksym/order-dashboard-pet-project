import { useMemo, useState } from "react";

import type { Order, OrderStatus } from "@/shared/types/order";
import {
  ALL_CITIES,
  ALL_STATUSES,
  STATUS_LABELS,
} from "@/features/orders/constants";

import type {
  PerformanceQuery,
  BenchmarkResult,
  PerfPoint,
} from "@/features/performance/types";
import { runBenchmark } from "@/features/performance/utils/benchmark-runner";
import { toggleInList } from "@/features/orders/utils/filterUtils";
import { safeNumber } from "@/shared/utils";

import { PerformanceComparisonLineChart } from "@/features/performance/components/performance-comparison-line-chart";
import {
  FiltersAdvancedState,
  FiltersAdvancedValue,
} from "@/features/performance-advanced/types";

import "./performance-advanced-page.scss";
import { generateOrdersDataset } from "@/features/performance/utils/generate-orders-dataset";

const DATASET_PRESETS: ReadonlyArray<number> = [
  1000, 5000, 10000, 30000, 60000,
];

export default function PerformanceAdvanced() {
  const [form, setForm] = useState<FiltersAdvancedState>({
    datasetSize: 10000,
    runs: 10, // скільки разів усереднювати (зменшує шум)
    statuses: ["new", "processing"],
    cities: [],
    dateFrom: "2026-02-01",
    dateTo: "2026-02-20",
    minAmount: "",
    maxAmount: "",
  });

  const [result, setResult] = useState<BenchmarkResult | null>(null);
  // Дані для графіка. Порожній масив = графік не показуємо.
  const [chartData, setChartData] = useState<ReadonlyArray<PerfPoint>>([]);
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // Текст помилки (якщо щось впало в runBenchmark)

  // Seed — “зерно” для генератора випадкових чисел (псевдовипадкових)
  // Ідея: той самий seed => той самий dataset
  // Це робить порівняння чесним: змінюються алгоритми/фільтри, а не випадкові дані
  const seed = 1337;

  const {
    datasetSize,
    runs,
    statuses,
    cities,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
  } = form;

  const orders = useMemo<ReadonlyArray<Order>>(() => {
    // створює масив Order потрібного розміру
    return generateOrdersDataset({ size: datasetSize, seed });
  }, [datasetSize]);

  // Створюємо об’єкт query — саме те, що піде в runBenchmark
  const query = useMemo<PerformanceQuery>(() => {
    return {
      statuses,
      cities,
      dateFrom,
      dateTo,
      minAmount: safeNumber(minAmount), // якщо інпут порожній → undefined (значить “не фільтрувати по minAmount”)
      maxAmount: safeNumber(maxAmount), // якщо не число → теж undefined
    };
  }, [statuses, cities, dateFrom, dateTo, minAmount, maxAmount]);

  // Запуск benchmark + побудова графіка
  function handleRun() {
    // Це дає “чистий запуск” і не показує старі цифри поки рахується нове
    setIsBenchmarkRunning(true);
    setError(null); // чистимо попередню помилку
    setResult(null); // чистимо попередній результат
    setChartData([]); // чистимо попередній графік

    try {
      // Викликаємо runBenchmark для поточного orders (розмір = datasetSize)
      // runBenchmark всередині міряє naive, міряє optimized, усереднює runs, рахує speedup, 	рахує cache hits/misses (якщо реалізовано)
      const res = runBenchmark({
        orders,
        query,
        runs,
      });
      setResult(res);

      // Створюємо точки для графіка
      // Для кожного preset size: 1000, 5000, … 60000
      const points: PerfPoint[] = DATASET_PRESETS.map((size) => {
        const dataset = generateOrdersDataset({ size, seed });
        // Генеруємо dataset певного розміру
        const benchmarkResult = runBenchmark({ orders: dataset, query, runs });

        // Запускаємо benchmark на цьому dataset
        return {
          size,
          naiveMs: benchmarkResult.naiveMs,
          optimizedMs: benchmarkResult.optimizedMs,
        };
      });

      // Приводимо до формату PerfPoint для графіка
      setChartData(points);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsBenchmarkRunning(false);
    }
  }

  const updateFormField = <K extends keyof FiltersAdvancedState>(
    key: K,
    value: FiltersAdvancedValue<K>,
  ) => {
    setForm((prev) => {
      if (key === "cities") {
        return {
          ...prev,
          cities: toggleInList(prev.cities, value as string),
        };
      }

      if (key === "statuses") {
        return {
          ...prev,
          statuses: toggleInList(prev.statuses, value as OrderStatus),
        };
      }

      return { ...prev, [key]: value };
    });

    setResult(null);
    setChartData([]);
  };

  // Скидає тільки фільтри (query), але не datasetSize/runs
  // Після reset — результат/графік теж очищається
  const handleResetQuery = () => {
    setForm((prev) => ({
      ...prev,
      statuses: [],
      cities: [],
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
    }));
    setResult(null);
    setChartData([]);
  };

  const handleSelectAllCities = () => {
    setForm((prev) => ({ ...prev, cities: [...ALL_CITIES] }));
    setResult(null);
    setChartData([]);
  };

  const handleSelectAllStatuses = () => {
    setForm((prev) => ({
      ...prev,
      statuses: ["new", "processing", "completed", "cancelled"],
    }));
    setResult(null);
    setChartData([]);
  };

  return (
    <div className="performance-advanced-page">
      <div className="performance-advanced-page__header">
        <h1 className="performance-advanced-page__title">
          Performance benchmark
        </h1>
        <div className="performance-advanced-page__subtitle">
          This page demonstrates algorithmic complexity: a naive approach
          (Array.includes / repeated scans) versus an optimized approach
          (indexes + Set/Map + cache). Increase dataset size to make the
          difference visible.
        </div>
      </div>

      <section className="performance-advanced-page__card">
        <div className="performance-advanced-page__card-header">
          <div className="performance-advanced-page__card-title">Dataset</div>
          <div className="performance-advanced-page__card-meta">
            Orders generated: {orders.length.toLocaleString()}
          </div>
        </div>

        <div className="performance-advanced-page__card-row">
          <div className="performance-advanced-page__card-field">
            <div className="performance-advanced-page__card-label">
              Size presets
            </div>
            <div className="performance-advanced-page__card-chips">
              {DATASET_PRESETS.map((number) => (
                <button
                  key={number}
                  type="button"
                  className={
                    number === datasetSize
                      ? "performance-advanced-page__card-chip performance-advanced-page__card-chip--active"
                      : "performance-advanced-page__card-chip"
                  }
                  onClick={() => updateFormField("datasetSize", number)}
                >
                  {number.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="performance-advanced-page__card-field">
            <div className="performance-advanced-page__card-label">
              Runs (average)
            </div>
            <input
              className="performance-advanced-page__card-input"
              value={String(runs)}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) {
                  updateFormField(
                    "runs",
                    Math.max(1, Math.min(50, Math.floor(n))),
                  );
                }
              }}
              inputMode="numeric"
              placeholder="10"
            />
            <div className="performance-advanced-page__card-hint">
              More runs = more stable numbers (but slower).
            </div>
          </div>

          <div className="performance-advanced-page__card-field">
            <div className="performance-advanced-page__card-label">Seed</div>
            <input
              className="performance-advanced-page__card-input"
              value={String(seed)}
              readOnly
            />
            <div className="performance-advanced-page__card-hint">
              Same seed → same dataset → fair comparison.
            </div>
          </div>
        </div>
      </section>

      <section className="performance-advanced-page__card">
        <div className="performance-advanced-page__card-header">
          <div className="performance-advanced-page__card-title">Query</div>
          <div className="performance-advanced-page__card-meta">
            Selected cities: {cities.length ? cities.length : "—"}
          </div>
        </div>

        <div className="performance-advanced-page__card-row performance-advanced-page__card-row--2">
          <div className="performance-advanced-page__card-field">
            <div className="performance-advanced-page__card-label">
              Date from (YYYY-MM-DD)
            </div>
            <input
              className="performance-advanced-page__card-input"
              value={dateFrom}
              onChange={(e) => updateFormField("dateFrom", e.target.value)}
              placeholder="2026-02-01"
            />
          </div>

          <div className="performance-advanced-page__card-field">
            <div className="performance-advanced-page__card-label">
              Date to (YYYY-MM-DD)
            </div>
            <input
              className="performance-advanced-page__card-input"
              value={dateTo}
              onChange={(e) => updateFormField("dateTo", e.target.value)}
              placeholder="2026-02-20"
            />
          </div>
        </div>

        <div className="performance-advanced-page__card-row performance-advanced-page__card-row--2">
          <div className="performance-advanced-page__card-field">
            <div className="performance-advanced-page__card-label">
              Min amount
            </div>
            <input
              className="performance-advanced-page__card-input"
              value={minAmount}
              onChange={(e) => updateFormField("minAmount", e.target.value)}
              placeholder="e.g. 100"
              inputMode="numeric"
            />
          </div>

          <div className="performance-advanced-page__card-field">
            <div className="performance-advanced-page__card-label">
              Max amount
            </div>
            <input
              className="performance-advanced-page__card-input"
              value={maxAmount}
              onChange={(e) => updateFormField("maxAmount", e.target.value)}
              placeholder="e.g. 3000"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="performance-advanced-page__card-section">
          <div className="performance-advanced-page__card-section-title">
            Statuses
          </div>
          <div className="performance-advanced-page__card-options">
            {ALL_STATUSES.map((status) => {
              const checked = statuses.includes(status);

              return (
                <label
                  key={status}
                  className="performance-advanced-page__card-option"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => updateFormField("statuses", status)}
                  />
                  <span>{STATUS_LABELS[status]}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="performance-advanced-page__card-section">
          <div className="performance-advanced-page__card-section-title">
            Cities
          </div>
          <div className="performance-advanced-page__card-options">
            {ALL_CITIES.map((city) => {
              const checked = cities.includes(city);

              return (
                <label
                  key={city}
                  className="performance-advanced-page__card-option"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => updateFormField("cities", city)}
                  />
                  <span>{city}</span>
                </label>
              );
            })}
          </div>

          <div className="performance-advanced-page__card-hint">
            Tip: choose more cities to make membership checks heavier.
          </div>
        </div>

        <div className="performance-advanced-page__card-actions">
          <button
            type="button"
            className="performance-advanced-page__card-btn"
            onClick={handleResetQuery}
          >
            Reset query
          </button>

          <button
            type="button"
            className="performance-advanced-page__card-btn performance-advanced-page__card-btn--ghost"
            onClick={handleSelectAllCities}
          >
            Select all cities
          </button>

          <button
            type="button"
            className="performance-advanced-page__card-btn performance-advanced-page__card-btn--ghost"
            onClick={handleSelectAllStatuses}
          >
            Select all statuses
          </button>
        </div>
      </section>

      {/* Run */}
      <div className="performance-advanced-page__runbar">
        <button
          type="button"
          onClick={handleRun}
          disabled={isBenchmarkRunning}
          className="performance-advanced-page__runbtn"
        >
          {isBenchmarkRunning ? "Running…" : "Run benchmark"}
        </button>

        <div className="performance-advanced-page__runhint">
          Increase dataset size to make the complexity difference visible.
        </div>
      </div>

      {error ? (
        <div className="performance-advanced-page__alert performance-advanced-page__alert--error">
          Error: {error}
        </div>
      ) : null}

      {result ? (
        <section className="performance-advanced-page__card">
          <div className="performance-advanced-page__card-header">
            <div className="performance-advanced-page__card-title">Result</div>
            <div className="performance-advanced-page__card-meta">
              Dataset: {result.datasetSize.toLocaleString()} • Runs:{" "}
              {result.runs}
            </div>
          </div>

          <div className="performance-advanced-page__metrics">
            <div className="performance-advanced-page__metric">
              <div className="performance-advanced-page__metric-label">
                Naive (repeated scans)
              </div>
              <div className="performance-advanced-page__metric-value">
                {result.naiveMs.toFixed(2)} ms
              </div>
              <div className="performance-advanced-page__metric-sub">
                Average over {result.runs} runs
              </div>
            </div>

            <div className="performance-advanced-page__metric">
              <div className="performance-advanced-page__metric-label">
                Optimized (indexes + Set/Map + cache)
              </div>
              <div className="performance-advanced-page__metric-value">
                {result.optimizedMs.toFixed(2)} ms
              </div>
              <div className="performance-advanced-page__metric-sub">
                Cache hits: {result.cacheHits} • misses: {result.cacheMisses}
              </div>
            </div>
          </div>

          <div className="performance-advanced-page__summary">
            <div className="performance-advanced-page__summary-item">
              Speedup: <b>{result.speedup.toFixed(2)}x</b>
            </div>
            <div className="performance-advanced-page__summary-item">
              Optimized cache:{" "}
              <b>
                {result.cacheHits}/{result.cacheHits + result.cacheMisses}
              </b>
            </div>
          </div>

          <div className="performance-advanced-page__hint">
            Naive scales worse because it repeatedly scans arrays (membership
            checks are O(m)). Optimized reduces checks using indexes + Set/Map
            (~O(1)) and caches repeated queries.
          </div>
        </section>
      ) : null}

      {chartData.length > 0 ? (
        <PerformanceComparisonLineChart data={chartData} />
      ) : null}
    </div>
  );
}
