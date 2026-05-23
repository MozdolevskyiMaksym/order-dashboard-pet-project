// Цей файл містить оптимізовану версію фільтрації замовлень з використанням індексів для швидкого доступу до кандидатів по статусу та місту,
// а також ефективного перетину цих кандидатів. Це дозволяє значно зменшити кількість елементів,
// які потрібно перевірити при застосуванні “дорогих” фільтрів (дата, сума), що покращує продуктивність при великих обсягах даних.

// Якщо своїми словами, то ми спочатку створюємо структуру даних по ключу (статус, місто), за допомогою createOptimizedIndex
// щоб швидко отримувати всі замовлення з певним статусом або з певного міста. А потім вже робимо фільтрацію по даті та сумі тільки для цих кандидатів, а не для всіх замовлень.
// Це класична оптимізація за допомогою індексів.

import type { Order, OrderStatus } from "@/shared/types/order";
import type { PerformanceQuery } from "@/features/performance/types";
import { formatIsoToDay } from "@/shared/utils";

// Оптимізація: індекси + Set/Map
// - indexByStatus: status -> array of orders
// - indexByCity: city -> array of orders
// Далі робимо перетин кандидатів (беремо найменший список і фільтруємо)

// Це структура даних, яку ми будуємо
export type OrdersOptimizedIndex = Readonly<{
  byStatus: ReadonlyMap<OrderStatus, ReadonlyArray<Order>>;
  byCity: ReadonlyMap<string, ReadonlyArray<Order>>;
  all: ReadonlyArray<Order>;
}>;

// будуємо індекси один раз, а потім багато разів робимо швидкі запити
// щоб отримати кандидатів по status/city, а потім вже застосувати “дорогі” фільтри (дата, сума) тільки до них
export function createOptimizedIndex(
  orders: ReadonlyArray<Order>,
): OrdersOptimizedIndex {
  const byStatus = new Map<OrderStatus, Order[]>();
  const byCity = new Map<string, Order[]>();

  for (const order of orders) {
    // Індекс за статусом
    const statusList = byStatus.get(order.status);
    if (statusList) {
      statusList.push(order);
    } else {
      byStatus.set(order.status, [order]);
    }
    // Індекс за містом
    const cityList = byCity.get(order.city);
    if (cityList) {
      cityList.push(order);
    } else {
      byCity.set(order.city, [order]);
    }
  }

  // це робиться один раз перед benchmark-ом, і потім query працює швидше

  return { byStatus, byCity, all: orders };
}

// Вибираємо “кандидатів” по status/city
// Це ключова оптимізація
function intersectCandidates(
  index: OrdersOptimizedIndex,
  statuses: ReadonlyArray<OrderStatus>,
  cities: ReadonlyArray<string>,
): ReadonlyArray<Order> {
  const hasStatuses = statuses.length > 0;
  const hasCities = cities.length > 0;

  if (!hasStatuses && !hasCities) {
    return index.all; // Якщо немає ні statuses, ні cities — кандидатами є всі orders
  }

  // Це проміжний список, який ми будемо “звужувати”
  let candidates: ReadonlyArray<Order> | null = null;

  // Якщо є statuses → зливаємо “кошики” статусів
  if (hasStatuses) {
    let mergedOrders: Order[] = [];
    for (const status of statuses) {
      const bucket = index.byStatus.get(status); // Для кожного статусу беремо відповідний масив orders з byStatus
      if (bucket) {
        mergedOrders = mergedOrders.concat(bucket); // Об’єднуємо всі ці масиви в один великий список mergedOrders
      }
    }
    candidates = mergedOrders;

    // Це фактично union по статусах:
    // "дай всі orders, які мають будь-який з цих статусів".
  }

  // Якщо є cities → аналогічно збираємо merged по містах
  if (hasCities) {
    let mergedOrders: Order[] = [];
    for (const city of cities) {
      const bucket = index.byCity.get(city);
      if (bucket) {
        mergedOrders = mergedOrders.concat(bucket);
      }
    }

    if (candidates == null) {
      candidates = mergedOrders;
    } else {
      // Якщо candidates вже був → робимо перетин статусів і міст
      // Щоб зробити перетин швидко: створюємо Set з id усіх orders із mergedOrders
      // проходимо по candidates і залишаємо тільки ті, чий id є в Set
      const set = new Set(mergedOrders.map((order) => order.id));
      const filtered: Order[] = [];
      for (const candidate of candidates) {
        // Set дає перевірку has() приблизно за O(1), тому це швидко
        if (set.has(candidate.id)) {
          filtered.push(candidate);
        }
      }
      candidates = filtered;
    }
  }

  return candidates ?? index.all;
}

// Фінальна фільтрація
export function optimizedFilterOrders(
  index: OrdersOptimizedIndex,
  query: PerformanceQuery,
): ReadonlyArray<Order> {
  console.log("index: ", index);
  const candidates = intersectCandidates(index, query.statuses, query.cities); // Беремо кандидатів по status/city (швидка частина)
  const filteredOrders: Order[] = [];

  // Далі проходимо тільки по кандидатах і застосовуємо “дорогі” фільтри
  for (const candidate of candidates) {
    // Фільтрація по даті
    const day = formatIsoToDay(candidate.createdAt);

    if (query.dateFrom) {
      if (day < query.dateFrom) {
        continue;
      }
    }

    if (query.dateTo) {
      if (day > query.dateTo) {
        continue;
      }
    }

    // Фільтрація по сумі
    if (query.minAmount != null) {
      if (candidate.amount < query.minAmount) {
        continue;
      }
    }

    if (query.maxAmount != null) {
      if (candidate.amount > query.maxAmount) {
        continue;
      }
    }

    // Якщо пройшов всі умови — додаємо в результат
    filteredOrders.push(candidate);
  }

  return filteredOrders;
}
