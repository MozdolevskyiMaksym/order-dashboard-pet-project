import type { PerformanceQuery } from "@/features/performance/types";
import type { Order } from "@/shared/types/order";

// Простий кеш: ключ = серіалізований фільтр
export type QueryCache = Readonly<{
  get: (key: string) => ReadonlyArray<Order> | undefined; // повертає закешований масив Order[] або undefined, якщо нема
  set: (key: string, value: ReadonlyArray<Order>) => void; // записує результат у кеш
  clear: () => void; // очищає кеш і обнуляє статистику
  stats: () => Readonly<{ hits: number; misses: number; size: number }>; // повертає лічильники
  // hits — скільки разів знайшли в кеші
  // misses — скільки разів не знайшли в кеші
  // size — скільки записів зараз у Map
}>;

// як будується ключ
// Функція приймає фільтр query і повертає рядковий ключ для кеша
export function makeQueryKey(query: PerformanceQuery): string {
  return JSON.stringify({
    statuses: query.statuses,
    cities: query.cities,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    minAmount: query.minAmount ?? null,
    maxAmount: query.maxAmount ?? null,
  });
}

// Реалізація кеша
export function createQueryCache(): QueryCache {
  const map = new Map<string, ReadonlyArray<Order>>(); // Фабрика: створює і повертає новий кеш (новий стан) з потрібними методами
  // Внутрішнє сховище кеша:
  // ключ: string (те, що повертає makeQueryKey)
  // значення: масив Order[] (результат фільтрації)

  let hits = 0; // hits: знайдено в кеші
  let misses = 0; // misses: не знайдено в кеші

  // Повертаємо об’єкт, який відповідає типу QueryCache
  return {
    // Пробуємо дістати значення з Map
    get(key) {
      const cachedValue = map.get(key);

      if (cachedValue) {
        hits += 1; // Якщо значення є — це cache hit
        return cachedValue;
      }

      // Якщо значення нема — це cache miss
      misses += 1;
      return undefined;
    },
    // Записуємо результат у кеш за ключем
    set(key, value) {
      map.set(key, value);
    },
    // Очищуємо Map
    // Обнуляємо статистику
    clear() {
      map.clear();
      hits = 0;
      misses = 0;
    },
    // Повертаємо об’єкт зі статистикою
    // hits, misses — лічильники
    // size: map.size — скільки записів в кеші зараз
    stats() {
      return { hits, misses, size: map.size };
    },
  };
}
