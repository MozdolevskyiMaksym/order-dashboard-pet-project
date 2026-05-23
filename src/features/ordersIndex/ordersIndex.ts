import type { Order, OrderStatus } from "@/shared/types/order";
import { formatIsoToDay } from "@/shared/utils";
import { ALL_STATUSES } from "../orders/constants";

export type OrdersIndexQuery = Readonly<{
  statuses?: ReadonlyArray<OrderStatus>;
  cities?: ReadonlyArray<string>;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  minAmount?: number;
  maxAmount?: number;
}>;

export type OrdersIndex = Readonly<{
  size: number;

  byId: ReadonlyMap<string, Order>;
  ids: ReadonlySet<string>;

  add: (order: Readonly<Order>) => void;
  update: (order: Readonly<Order>) => void;
  remove: (id: string) => void;

  query: (q: OrdersIndexQuery) => ReadonlyArray<Order>;
}>;

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function intersectSets<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  const out = new Set<T>();
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];

  for (const item of small) {
    if (big.has(item)) {
      out.add(item);
    }
  }

  return out;
}

export function createOrdersIndex(
  initialOrders: ReadonlyArray<Order>,
): OrdersIndex {
  const byId = new Map<string, Order>();
  const ids = new Set<string>();

  const byStatus = new Map<OrderStatus, Set<string>>();
  const byCity = new Map<string, Set<string>>();
  const byDay = new Map<string, Set<string>>();

  for (const status of ALL_STATUSES) {
    byStatus.set(status, new Set<string>());
  }

  function ensureSet(map: Map<string, Set<string>>, key: string): Set<string> {
    const existing = map.get(key);
    if (existing) {
      return existing;
    }

    const next = new Set<string>();
    map.set(key, next);
    return next;
  }

  function addToIndex(order: Order): void {
    const id = order.id;

    ids.add(id);
    byId.set(id, order);

    const statusSet = byStatus.get(order.status);
    if (statusSet) {
      statusSet.add(id);
    }

    ensureSet(byCity, order.city).add(id);

    const day = formatIsoToDay(order.createdAt);
    ensureSet(byDay, day).add(id);
  }

  function removeFromIndex(order: Order): void {
    const id = order.id;

    ids.delete(id);
    byId.delete(id);

    const statusSet = byStatus.get(order.status);
    if (statusSet) {
      statusSet.delete(id);
    }

    const citySet = byCity.get(order.city);
    if (citySet) {
      citySet.delete(id);
      if (citySet.size === 0) {
        byCity.delete(order.city);
      }
    }

    const day = formatIsoToDay(order.createdAt);
    const daySet = byDay.get(day);
    if (daySet) {
      daySet.delete(id);
      if (daySet.size === 0) {
        byDay.delete(day);
      }
    }
  }

  for (const o of initialOrders) {
    addToIndex(o);
  }

  function add(order: Readonly<Order>): void {
    const existing = byId.get(order.id);
    if (existing) {
      update(order);
      return;
    }

    addToIndex({ ...order });
  }

  function update(order: Readonly<Order>): void {
    const existing = byId.get(order.id);
    if (!existing) {
      add(order);
      return;
    }

    const sameStatus = existing.status === order.status;
    const sameCity = existing.city === order.city;
    const sameDay =
      formatIsoToDay(existing.createdAt) === formatIsoToDay(order.createdAt);

    if (!sameStatus || !sameCity || !sameDay) {
      removeFromIndex(existing);
      addToIndex({ ...order });
      return;
    }

    byId.set(order.id, { ...order });
  }

  function remove(id: string): void {
    const existing = byId.get(id);
    if (!existing) {
      return;
    }

    removeFromIndex(existing);
  }

  function query(q: OrdersIndexQuery): ReadonlyArray<Order> {
    let candidateIds: ReadonlySet<string> = ids;

    if (q.statuses && q.statuses.length > 0) {
      const union = new Set<string>();

      for (const s of q.statuses) {
        const setForStatus = byStatus.get(s);
        if (setForStatus) {
          for (const id of setForStatus) {
            union.add(id);
          }
        }
      }

      candidateIds = intersectSets(candidateIds, union);
    }

    if (q.cities && q.cities.length > 0) {
      const union = new Set<string>();

      for (const city of q.cities) {
        const setForCity = byCity.get(city);
        if (setForCity) {
          for (const id of setForCity) {
            union.add(id);
          }
        }
      }

      candidateIds = intersectSets(candidateIds, union);
    }

    if (q.dateFrom || q.dateTo) {
      const from = q.dateFrom ?? "0000-00-00";
      const to = q.dateTo ?? "9999-12-31";

      const union = new Set<string>();
      for (const [day, setForDay] of byDay.entries()) {
        if (day >= from && day <= to) {
          for (const id of setForDay) {
            union.add(id);
          }
        }
      }

      candidateIds = intersectSets(candidateIds, union);
    }

    const out: Order[] = [];
    for (const id of candidateIds) {
      const o = byId.get(id);
      if (!o) {
        continue;
      }

      if (isFiniteNumber(q.minAmount) && o.amount < q.minAmount) {
        continue;
      }

      if (isFiniteNumber(q.maxAmount) && o.amount > q.maxAmount) {
        continue;
      }

      out.push(o);
    }

    out.sort((a, b) => {
      if (a.createdAt > b.createdAt) {
        return -1;
      }
      if (a.createdAt < b.createdAt) {
        return 1;
      }
      return 0;
    });

    return out;
  }

  return {
    size: ids.size,
    byId,
    ids,
    add,
    update,
    remove,
    query,
  };
}
