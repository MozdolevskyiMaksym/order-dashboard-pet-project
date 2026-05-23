// Це "диригент" бенчмарку
// 1. запускає наївну фільтрацію кілька разів і міряє час
// 2.	запускає оптимізовану фільтрацію кілька разів і міряє час
// 3.	для optimized додатково показує ефект кешу запитів (cache hits / misses)
// 4.	повертає зведений результат BenchmarkResult
import type { Order } from "@/shared/types/order";
import type {
  BenchmarkResult,
  PerformanceQuery,
} from "@/features/performance/types";
// Наївний алгоритм: зазвичай “сканує масив”, робить includes, повторні перевірки — простіше, але повільніше при великих даних.
import { naiveFilterOrders } from "./naive-query";
import { createOptimizedIndex, optimizedFilterOrders } from "./optimized-index";
import { createQueryCache, makeQueryKey } from "./cache";

export function runBenchmark({
  orders,
  query,
  runs,
}: {
  orders: ReadonlyArray<Order>; // датасет замовлень
  query: PerformanceQuery; // фільтр, який ми тестуємо
  runs: number; // скільки разів повторити вимірювання
}): BenchmarkResult {
  // Тут зберігаємо кожен замір часу для
  const naiveTimes: number[] = []; // naive прогонів
  const optimizedTimes: number[] = []; // optimized прогонів
  // Потім з них зробимо average

  // Частина A: вимірюємо naive
  // вимірюємо naive
  for (let i = 0; i < runs; i += 1) {
    const t0 = performance.now();
    const naiveRes = naiveFilterOrders({ orders, query }); // Виконуємо наївну фільтрацію
    const t1 = performance.now();

    // Щоб JS-рушій не “викинув” обчислення
    // Це “трюк” проти оптимізації рушія:
    // Деякі JS-рушії можуть “зрозуміти”, що результат ніде не використовується, і частково оптимізувати виконання (теоретично).
    // Тому ми робимо формальне “використання” результату.
    // naiveRes.length < 0 ніколи не буде true, але посилання на naiveRes є — отже “ніби використали”
    if (naiveRes.length < 0) {
      // no-op
    }

    naiveTimes.push(t1 - t0); // Записали час цього прогону в масив
  }

  // Частина B: вимірюємо optimized + cache
  // Спочатку робимо ключ
  const key = makeQueryKey(query); //  детермінований “підпис” query. Якщо query повторюється — key буде однаковий

  // ідея “оптимізованого рішення” часто саме в тому, що ти платиш один раз за індексацію, а потім робиш багато швидких запитів.
  const index = createOptimizedIndex(orders); // index будується один раз на весь benchmark
  // Це об’єкт з методами get/set/clear/stats
  const cache = createQueryCache(); // порожній кеш для збереження результатів по ключу запиту
  // Далі прогони
  for (let i = 0; i < runs; i += 1) {
    const t0 = performance.now();

    // На кожному прогоні пробуємо взяти результат з кешу
    const cached = cache.get(key);

    // Якщо знайшли в кеші
    if (cached) {
      // рахуємо лише час доступу до кешу (get) і додаємо цей час у optimizedTimes
      const t1 = performance.now();
      optimizedTimes.push(t1 - t0);
      continue; // пропускаємо реальну фільтрацію (бо вона не потрібна)
    }

    // Якщо в кеші немає
    const res = optimizedFilterOrders(index, query); // Виконуємо оптимізовану фільтрацію через індекс
    cache.set(key, res); // Кладемо результат у кеш

    // Записуємо час
    const t1 = performance.now();
    optimizedTimes.push(t1 - t0);
  }

  // Підсумки: середні значення + speedup
  const naiveMs = average(naiveTimes);
  const optimizedMs = average(optimizedTimes);

  // Усереднюємо часи
  const speedup = optimizedMs > 0 ? naiveMs / optimizedMs : 0;
  const stats = cache.stats();

  return {
    datasetSize: orders.length,
    runs,
    naiveMs,
    optimizedMs,
    speedup,
    cacheHits: stats.hits,
    cacheMisses: stats.misses,
  };
}

// На вхід: масив виміряних часів (в мілісекундах).
// На вихід: середнє значення.
// Якщо масив пустий — повертає 0 (щоб не було ділення на 0).
function average(ms: ReadonlyArray<number>): number {
  if (ms.length === 0) {
    return 0;
  }

  const sum = ms.reduce((a, b) => a + b, 0);
  return sum / ms.length;
}

// Тобто UI потім показує: розмір датасету, скільки прогонів, середній час naive, середній час optimized, speedup,cache hits/misses
