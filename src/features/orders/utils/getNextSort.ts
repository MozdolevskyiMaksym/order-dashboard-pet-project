import type { OrdersSort, OrdersSortKey } from "../types";

export function getNextSort(
  current: OrdersSort,
  key: OrdersSortKey,
): OrdersSort {
  // Якщо клікаємо по тій самій колонці — перевертаємо напрямок
  if (current.key === key) {
    return {
      key,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  }

  // Якщо це нова колонка — ставимо дефолтний напрямок
  // createdAt логічно сортувати “новіші зверху”
  if (key === "createdAt") {
    return {
      key,
      direction: "desc",
    };
  }

  return {
    key,
    direction: "asc",
  };
}
