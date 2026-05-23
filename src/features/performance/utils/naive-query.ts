import type { Order } from "@/shared/types/order";
import type { PerformanceQuery } from "@/features/performance/types";
import { formatIsoToDay } from "@/shared/utils";

// Наївна реалізація: O(n * (statuses + cities)) через includes у масивах
export function naiveFilterOrders({
  orders,
  query, // об’єкт фільтрів
}: {
  orders: ReadonlyArray<Order>;
  query: PerformanceQuery;
}): ReadonlyArray<Order> {
  // Повертаємо масив замовлень, які підійшли
  const statuses = query.statuses;
  const cities = query.cities;

  // Заздалегідь рахуємо, активні фільтри чи ні
  // Щоб у циклі не робити .length > 0 щоразу
  const hasStatuses = statuses.length > 0;
  const hasCities = cities.length > 0;

  const filteredOrders = []; // Масив результатів, куди будемо пушити замовлення, які підходять

  for (const order of orders) {
    if (!matchesStatus(order.status, statuses, hasStatuses)) {
      continue; // пропустити цей order і перейти до наступного
    }

    if (!matchesCity(order.city, cities, hasCities)) {
      continue;
    }

    if (!matchesDateRange(order.createdAt, query.dateFrom, query.dateTo)) {
      continue;
    }

    if (!matchesAmountRange(order.amount, query.minAmount, query.maxAmount)) {
      continue;
    }

    // Якщо всі перевірки пройшли — додаємо order у результат
    filteredOrders.push(order);
  }

  // Повертаємо список відібраних замовлень
  return filteredOrders;
}

// допоміжні функції, які перевіряють чи підходять умови
function matchesStatus(
  status: Order["status"],
  statuses: ReadonlyArray<Order["status"]>,
  hasStatuses: boolean,
): boolean {
  // Якщо фільтрів по статусу немає — всі підходять, тому повертаємо true. Інакше перевіряємо, чи є статус замовлення в масиві статусів фільтра.
  return !hasStatuses || statuses.includes(status);
}

function matchesCity(
  city: Order["city"],
  cities: ReadonlyArray<Order["city"]>,
  hasCities: boolean,
): boolean {
  return !hasCities || cities.includes(city);
}

function matchesDateRange(
  createdAt: Order["createdAt"],
  dateFrom?: string,
  dateTo?: string,
): boolean {
  if (!dateFrom && !dateTo) {
    return true;
  }

  const day = formatIsoToDay(createdAt);
  return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
}

function matchesAmountRange(
  amount: Order["amount"],
  minAmount?: number,
  maxAmount?: number,
): boolean {
  return (
    (!minAmount || amount >= minAmount) && (!maxAmount || amount <= maxAmount)
  );
}

// Найповільніше місце тут:
// statuses.includes(...) і cities.includes(...) — це пошук в масиві, який у гіршому випадку пробігає весь масив фільтра.
// Тобто при великій кількості вибраних міст/статусів кожна перевірка стає дорожчою
