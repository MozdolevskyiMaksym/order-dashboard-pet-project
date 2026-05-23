import { useMemo, useState } from "react";
import {
  ALL_CITIES,
  ALL_STATUSES,
  STATUS_LABELS,
} from "@/features/orders/constants";
import {
  formatMoney,
  formatMs,
  toNumberOrUndefined,
  toggleInList,
} from "@/shared/utils";

import { generateOrdersDataset } from "@/features/performance/utils/generate-orders-dataset";
import {
  measureAvg, // зменшує “шум” вимірювання: робить N запусків і бере середнє
  runNaive, // повільний алгоритм (Array.includes)
  runOptimized, // оптимізований алгоритм (Set/Map)
} from "@/features/performance/utils/benchmarks";
import { PerformanceComparisonLineChart } from "@/features/performance/components/performance-comparison-line-chart";
import {
  DatasetSize,
  FiltersState,
  FilterValue,
  PerfPoint,
  RunResult,
} from "@/features/performance/types";

import "./performance-page.scss";

const CHART_SIZES: ReadonlyArray<DatasetSize> = [1000, 10000, 50000];

export default function Performance() {
  const [filters, setFilters] = useState<FiltersState>({
    size: 10000,
    statuses: ["new", "processing"],
    cities: ["Kyiv", "Lviv"],
    minAmount: "",
    maxAmount: "",
  });

  const [result, setResult] = useState<RunResult | null>(null);
  const [chartData, setChartData] = useState<ReadonlyArray<PerfPoint>>([]);

  // Ми не хочемо створювати його знову при кожному кліку по чекбоксу. Тому робимо useMemo і залежність тільки від size
  const { size, statuses, cities, minAmount, maxAmount } = filters;

  const orders = useMemo(() => {
    // створює масив з тисячами/десятками тисяч об’єктів
    return generateOrdersDataset({ size, seed: 1337 });
  }, [size]);

  const filter = useMemo(() => {
    return {
      statuses,
      cities,
      minAmount: toNumberOrUndefined(minAmount),
      maxAmount: toNumberOrUndefined(maxAmount),
    };
  }, [statuses, cities, minAmount, maxAmount]);

  // головна функція
  function runBenchmark() {
    // 1) Показники для поточного dataset size (усереднення)
    // Ми запускаємо один і той же фільтр двома різними реалізаціями
    // Але запускаємо 50 разів (щоб не ловити випадковий шум вимірювання)

    // повертає: ms — середній час, result — результат виконання (кількість відфільтрованих рядків, сума amount)
    const naive = measureAvg(50, () => runNaive(orders, filter).result);
    const optimized = measureAvg(50, () => runOptimized(orders, filter).result);

    // Якщо optimized швидше — speedup > 1
    // Якщо optimized повільніше — speedup < 1 (таке інколи буває на маленьких обсягах)
    const speedup = naive.ms > 0 ? naive.ms / optimized.ms : 0;

    setResult({
      naiveMs: naive.ms,
      optimizedMs: optimized.ms,
      speedup,
      filteredCount: optimized.result.filteredCount,
      totalAmount: optimized.result.totalAmount,
    });

    // 2) Точки для графіка по різних розмірах dataset (усереднення)
    // Ми будуємо не один бенчмарк, а тренд: 1k → 10k → 50k
    // Для кожного size: генеруємо dataset (стабільний завдяки seed), міряємо naive та optimized (усереднюємо 30 запусків), формуємо точку

    const points = CHART_SIZES.map((size) => {
      // знову генеруємо dataset для цього size (стабільний завдяки seed)
      const dataset = generateOrdersDataset({ size, seed: 1337 });

      const naiveS = measureAvg(30, () => runNaive(dataset, filter).result);
      const optS = measureAvg(30, () => runOptimized(dataset, filter).result);

      return {
        size,
        naiveMs: naiveS.ms,
        optimizedMs: optS.ms,
      };
    });

    setChartData(points);
  }

  const updateFilter = <K extends keyof FiltersState>(
    key: K,
    value: FilterValue<K>,
  ) => {
    setFilters((prev) => {
      if (key === "cities" || key === "statuses") {
        return {
          ...prev,
          [key]: toggleInList(
            prev[key] as ReadonlyArray<string>,
            value as string,
          ),
        };
      }
      return { ...prev, [key]: value };
    });
    setResult(null);
    setChartData([]);
  };

  return (
    <div className="performance-page">
      <div className="performance-page__header">
        <h1 className="performance-page__title">Performance demo</h1>
        <div className="performance-page__subtitle">
          Ця сторінка порівнює наївний підхід (Array.includes) та оптимізований
          підхід (Set/Map), щоб показати вплив алгоритмічної складності.
          <br />
          Щоб зменшити “шум” вимірювань, ми усереднюємо кілька запусків і також
          будуємо графік залежності від розміру набору даних.
        </div>
      </div>

      <div className="performance-page__card">
        <div className="performance-page__card-controls">
          <div className="performance-page__card-field">
            <div className="performance-page__card-label">
              Розмір набору даних
            </div>
            <select
              value={String(size)}
              onChange={(e) =>
                updateFilter("size", Number(e.target.value) as DatasetSize)
              }
            >
              <option value="1000">1,000</option>
              <option value="10000">10,000</option>
              <option value="50000">50,000</option>
            </select>
          </div>

          <div className="performance-page__card-field">
            <div className="performance-page__card-label">Мінімальна сума</div>
            <input
              value={minAmount}
              onChange={(e) => updateFilter("minAmount", e.target.value)}
              placeholder="наприклад, 200"
              inputMode="numeric"
            />
          </div>

          <div className="performance-page__card-field">
            <div className="performance-page__card-label">Максимальна сума</div>
            <input
              value={maxAmount}
              onChange={(e) => updateFilter("maxAmount", e.target.value)}
              placeholder="наприклад, 2000"
              inputMode="numeric"
            />
          </div>

          <div className="performance-page__card-run">
            <button
              type="button"
              onClick={runBenchmark}
              className="performance-page__card-button"
            >
              Запустити бенчмарк
            </button>
          </div>
        </div>

        <div className="performance-page__card-section">
          <div className="performance-page__card-section-title">
            Фільтр за статусом
          </div>
          <div className="performance-page__card-options">
            {ALL_STATUSES.map((status) => {
              const checked = statuses.includes(status);
              return (
                <label key={status} className="performance-page__card-option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => updateFilter("statuses", status)}
                  />
                  <span>{STATUS_LABELS[status]}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="performance-page__card-section">
          <div className="performance-page__card-section-title">
            Фільтр за містом
          </div>
          <div className="performance-page__card-options">
            {ALL_CITIES.map((city) => {
              const checked = cities.includes(city);
              return (
                <label key={city} className="performance-page__card-option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => updateFilter("cities", city)}
                  />
                  <span>{city}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="performance-page__card performance-page__card--results">
        <div className="performance-page__card-header">
          <div className="performance-page__card-section-title">Результати</div>
          <div className="performance-page__card-meta">
            Замовлень у наборі даних: {orders.length}
          </div>
        </div>

        {result ? (
          <div className="performance-page__card-section">
            <div className="performance-page__card-results-grid">
              <div className="performance-page__card-metric-label">
                Час наївного підходу
              </div>
              <div className="performance-page__card-metric-value">
                {formatMs(result.naiveMs, 2)}
              </div>

              <div className="performance-page__card-metric-label">
                Час оптимізованого підходу
              </div>
              <div className="performance-page__card-metric-value">
                {formatMs(result.optimizedMs, 2)}
              </div>

              <div className="performance-page__card-metric-label">
                Прискорення
              </div>
              <div className="performance-page__card-metric-value">
                {result.speedup.toFixed(2)}x
              </div>

              <div className="performance-page__card-metric-label">
                Відфільтровані рядки
              </div>
              <div className="performance-page__card-metric-value">
                {result.filteredCount}
              </div>

              <div className="performance-page__card-metric-label">
                Загальна сума відфільтрованих замовлень
              </div>
              <div className="performance-page__card-metric-value">
                ${formatMoney(result.totalAmount)}
              </div>
            </div>

            <div className="performance-page__card-hint">
              Наївний підхід використовує Array.includes для перевірки членства
              (O(m) за перевірку). Оптимізований підхід перетворює фільтри в
              Set/Map, що робить перевірки членства ~O(1). Для невеликих наборів
              даних різниця може бути незначною, але на більших наборах
              оптимізований підхід зазвичай виграє.
            </div>
          </div>
        ) : (
          <div className="performance-page__card-empty">
            Натисніть “Запустити бенчмарк”, щоб виміряти наївне та оптимізоване
            виконання.
          </div>
        )}
      </div>

      <PerformanceComparisonLineChart data={chartData} />
    </div>
  );
}
