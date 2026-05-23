import type { Order, OrderStatus } from "@/shared/types/order";
import { MeasureResult, PerfAggregateResult, PerfFilter } from "../types";

// Нормалізація чисел для фільтру
// щоб фільтр не ламався від некоректних значень
// і щоб далі код міг спокійно робити if (minAmount != null)
function clampNumberOrUndefined(value: number | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }
  if (!Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

// Перетворення мапи статистики в масив для UI
function makeByStatusArray(
  map: ReadonlyMap<OrderStatus, number>,
): ReadonlyArray<Readonly<{ status: OrderStatus; count: number }>> {
  const statuses: ReadonlyArray<OrderStatus> = [
    "new",
    "processing",
    "completed",
    "cancelled",
  ];

  // завжди повертаємо всі статуси (навіть якщо count 0)
  // порядок фіксований, щоб графік не “скакав”
  return statuses.map((status) => {
    return { status, count: map.get(status) ?? 0 };
  });
}

// measureAvg:
// запускає fn кілька разів
// робить "прогрів" (перший запуск не рахуємо)
// повертає середній час і останній result
// Це зменшує шум: JIT/GC/планувальник ОС можуть іноді робити optimized трохи повільнішим на одному запуску
export function measureAvg<T>(runs: number, fn: () => T): MeasureResult<T> {
  // якщо передали 0 або 1 → зробимо мінімум 2
  // якщо передали 100000 → обмежимо до 200 (щоб не зависало)
  // якщо передали 50.7 → округлимо вниз
  const safeRuns = Math.max(2, Math.min(200, Math.floor(runs)));

  // warmup (JIT, кеші, тощо)
  fn();

  // Основний цикл замірів

  // total накопичує суму часу всіх запусків
  // last зберігає результат останнього запуску (щоб показати дані не “порожні”)
  let total = 0;
  let last!: T;

  for (let i = 0; i < safeRuns; i += 1) {
    const t0 = performance.now();
    last = fn();
    const t1 = performance.now();
    total += t1 - t0;
  }

  // Повертаємо середнє час і результат останнього запуску
  return { ms: total / safeRuns, result: last };
}

// Naive версія: багато перевірок через Array.includes (O(m)),
// плюс агрегація в лоб. Загалом при великих фільтрах виходить O(n*m).
export function runNaive(
  orders: ReadonlyArray<Order>,
  filter: PerfFilter,
): MeasureResult<PerfAggregateResult> {
  // Початок заміру
  const t0 = performance.now();
  // Готуємо min/max
  const minAmount = clampNumberOrUndefined(filter.minAmount);
  const maxAmount = clampNumberOrUndefined(filter.maxAmount);

  const byStatus = new Map<OrderStatus, number>(); // статистика “скільки замовлень кожного статусу”
  let totalAmount = 0; // сума amount для пройшовших
  let filteredCount = 0; // скільки замовлень пройшло фільтр

  // Прохід по всім orders
  for (const order of orders) {
    if (filter.statuses.length > 0) {
      if (!filter.statuses.includes(order.status)) {
        continue; // пропустити цей order і перейти до наступного
      }
    }

    if (filter.cities.length > 0) {
      if (!filter.cities.includes(order.city)) {
        continue;
      }
    }

    if (minAmount != null && order.amount < minAmount) {
      continue;
    }

    if (maxAmount != null && order.amount > maxAmount) {
      continue;
    }

    // Якщо все підійшло — рахуємо
    filteredCount += 1;
    totalAmount += order.amount;

    const prev = byStatus.get(order.status) ?? 0;
    byStatus.set(order.status, prev + 1);
  }

  // Формуємо результат
  const result: PerfAggregateResult = {
    filteredCount,
    totalAmount,
    byStatus: makeByStatusArray(byStatus),
  };

  // Завершуємо замір
  // Повертаємо час і результат
  const t1 = performance.now();
  return { ms: t1 - t0, result };
}

// Optimized версія:
// перетворюємо statuses/cities у Set для O(1) lookup
// один прохід по orders
export function runOptimized(
  orders: ReadonlyArray<Order>,
  filter: PerfFilter,
): MeasureResult<PerfAggregateResult> {
  const t0 = performance.now();

  const minAmount = clampNumberOrUndefined(filter.minAmount);
  const maxAmount = clampNumberOrUndefined(filter.maxAmount);

  // Перетворюємо фільтри в Set
  const statusSet = new Set<OrderStatus>(filter.statuses);
  const citySet = new Set<string>(filter.cities);

  const byStatus = new Map<OrderStatus, number>();
  let totalAmount = 0;
  let filteredCount = 0;

  // Флаги, щоб не перевіряти зайве
  // Якщо фільтр пустий — не робимо .has() взагалі (це мікро-оптимізація)
  const useStatusFilter = statusSet.size > 0;
  const useCityFilter = citySet.size > 0;

  // Проходимо по orders лише один раз і робимо всі перевірки в одному місці
  for (const order of orders) {
    // У циклі вже не includes, а has
    if (useStatusFilter && !statusSet.has(order.status)) {
      continue;
    }

    if (useCityFilter && !citySet.has(order.city)) {
      continue;
    }

    if (minAmount != null && order.amount < minAmount) {
      continue;
    }

    if (maxAmount != null && order.amount > maxAmount) {
      continue;
    }

    filteredCount += 1;
    totalAmount += order.amount;

    const prev = byStatus.get(order.status) ?? 0;
    byStatus.set(order.status, prev + 1);
  }

  const result: PerfAggregateResult = {
    filteredCount,
    totalAmount,
    byStatus: makeByStatusArray(byStatus),
  };

  const t1 = performance.now();
  return { ms: t1 - t0, result };
}
