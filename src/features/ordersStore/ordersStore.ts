import type { Order, OrderStatus } from "@/shared/types/order";
import { formatIsoToDay } from "@/shared/utils";

export type OrdersQuery = Readonly<{
  statuses?: ReadonlyArray<OrderStatus>;
  cities?: ReadonlyArray<string>;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}>;

export type OrdersStore = Readonly<{
  size: number;
  getById: (id: string) => Order | undefined;
  getAll: () => ReadonlyArray<Order>;
  add: (order: Readonly<Order>) => void;
  update: (order: Readonly<Order>) => void;
  remove: (id: string) => void;
  upsertMany: (orders: ReadonlyArray<Readonly<Order>>) => void;
  query: (q: OrdersQuery) => ReadonlyArray<Order>;
  stats: () => Readonly<{
    ids: number;
    statuses: ReadonlyArray<Readonly<{ key: OrderStatus; count: number }>>;
    cities: number;
    days: number;
  }>;
}>;
// Простий індексований стор для заміни фільтрації "на льоту" через масив. Працює швидко навіть на 10к+ замовлень,
// але при цьому дозволяє легко і швидко отримувати статистику, яка потрібна для UI.

// Дає метод query(...), який приймає об'єкт з фільтрами і повертає всі замовлення, які їм відповідають.
// Фільтри можуть бути комбіновані між собою, і стор буде ефективно їх застосовувати, використовуючи індекси.
// Наприклад, якщо ми хочемо отримати всі замовлення зі статусом "new" і містом "Kyiv",
// то стор спочатку отримає множину id замовлень зі статусом "new", потім множину id замовлень з містом "Kyiv",
// а потім перетне ці множини і отримає id замовлень, які відповідають обом фільтрам.
// Після цього він відфільтрує ці замовлення за датою і сумою, якщо такі фільтри є.
export function createOrdersStore(
  initial: ReadonlyArray<Order> = [],
): OrdersStore {
  // Основна коллекция замовлень, де ключом є id замовлення, а значенням є саме замовлення.
  // Це дозволяє швидко отримувати замовлення за id, а також зберігати всі замовлення в одному місці.
  const byId = new Map<string, Order>();
  // Індекси для швидкого отримання id замовлень за статусом, містом і днем. Ключем є значення фільтра (наприклад, статус "new"), а значенням є множина id замовлень, які відповідають цьому фільтру.
  const byStatus = new Map<OrderStatus, Set<string>>();
  const byCity = new Map<string, Set<string>>();
  const byDay = new Map<string, Set<string>>();
  // Map — швидко знайти “кошик” по ключу (статус/місто)
  // Set — швидко перевірити наявність id / додати / видалити

  // Індексування замовлення: збереження його в byId і додавання його id в індекси за статусом, містом і днем.
  // Як order потрапляє в індекси:
  function indexOrder(order: Readonly<Order>) {
    byId.set(order.id, { ...order }); // кладемо повний об’єкт у byId
    // а в індексах зберігаємо тільки id
    // індекс = "вказівники"
    // console.log('byId: ', byId);
    // console.log('byStatus: ', byStatus);
    // console.log('byCity: ', byCity);
    // console.log('byDay: ', byDay);
    addToIndex(byStatus, order.status, order.id);
    addToIndex(byCity, order.city, order.id);
    addToIndex(byDay, formatIsoToDay(order.createdAt), order.id);
  }

  // Видалення замовлення з індексів і з byId.
  function unindexOrder(order: Readonly<Order>) {
    deleteFromIndex(byStatus, order.status, order.id);
    deleteFromIndex(byCity, order.city, order.id);
    deleteFromIndex(byDay, formatIsoToDay(order.createdAt), order.id);
    byId.delete(order.id);
  }

  // Додавання нового замовлення. Якщо замовлення з таким id вже існує, то воно не буде додано.
  function add(order: Readonly<Order>) {
    const existing = byId.get(order.id);
    if (existing) {
      return;
    }

    indexOrder(order);
  }

  // Оновлення замовлення. Якщо замовлення з таким id не існує, то воно буде додано.
  function update(order: Readonly<Order>) {
    const existing = byId.get(order.id);
    if (!existing) {
      indexOrder(order);
      return;
    }

    const prevDay = formatIsoToDay(existing.createdAt);
    const nextDay = formatIsoToDay(order.createdAt);

    // Якщо змінився статус, місто або день, то потрібно оновити відповідні індекси.
    if (existing.status !== order.status) {
      deleteFromIndex(byStatus, existing.status, order.id);
      addToIndex(byStatus, order.status, order.id);
    }

    // Якщо змінилося місто, то потрібно оновити індекс за містом.
    if (existing.city !== order.city) {
      deleteFromIndex(byCity, existing.city, order.id);
      addToIndex(byCity, order.city, order.id);
    }

    // Якщо змінилася дата, то потрібно оновити індекс за днем.
    if (prevDay !== nextDay) {
      deleteFromIndex(byDay, prevDay, order.id);
      addToIndex(byDay, nextDay, order.id);
    }

    // Оновлюємо саме замовлення в byId.
    byId.set(order.id, { ...order });
  }

  // Видалення замовлення за id. Якщо замовлення з таким id не існує, то нічого не відбувається.
  function remove(id: string) {
    const existing = byId.get(id);
    if (!existing) {
      return;
    }

    unindexOrder(existing);
  }

  // Додавання або оновлення багатьох замовлень. Використовується для ефективного застосування фільтрів,
  // які повертають багато замовлень.
  function upsertMany(orders: ReadonlyArray<Readonly<Order>>) {
    for (const order of orders) {
      update(order);
    }
  }

  function getById(id: string): Order | undefined {
    return byId.get(id);
  }

  function getAll(): ReadonlyArray<Order> {
    return Array.from(byId.values());
  }

  // Основний метод стору, який виконує фільтрацію замовлень за заданими критеріями.
  function query(q: OrdersQuery): ReadonlyArray<Order> {
    const candidateSets: Set<string>[] = [];

    // Для кожного фільтра, який можна ефективно застосувати через індекси (статус і місто),
    // отримуємо множину id замовлень, що йому відповідають, і додаємо ці множини в candidateSets.
    if (q.statuses && q.statuses.length > 0) {
      const union = new Set<string>();

      for (const status of q.statuses) {
        const set = byStatus.get(status);
        if (set) {
          for (const id of set) {
            union.add(id);
          }
        }
      }

      candidateSets.push(union);
    }

    // Якщо є фільтр за містом, то отримуємо множину id замовлень, які відповідають цьому фільтру, і додаємо її в candidateSets.
    if (q.cities && q.cities.length > 0) {
      const union = new Set<string>();

      for (const city of q.cities) {
        const set = byCity.get(city);
        if (set) {
          for (const id of set) {
            union.add(id);
          }
        }
      }

      candidateSets.push(union);
    }

    // Якщо немає фільтрів, які можна застосувати через індекси, то базовою множиною будет вся коллекция замовлень.
    const baseIds =
      candidateSets.length === 0
        ? new Set<string>(Array.from(byId.keys()))
        : intersectSets(candidateSets);

    const result: Order[] = [];

    // Далі проходимо по базовій множині id замовлень, отримуємо кожне замовлення і застосовуємо до нього фільтри,
    // які не можна застосувати через індекси (дата і сума). Якщо замовлення відповідає всім фільтрам,
    // то додаємо його в результат
    for (const id of baseIds) {
      const order = byId.get(id);
      if (!order) {
        continue;
      }

      const day = formatIsoToDay(order.createdAt);

      if (q.dateFrom && day < q.dateFrom) {
        continue;
      }

      if (q.dateTo && day > q.dateTo) {
        continue;
      }

      if (typeof q.minAmount === "number" && order.amount < q.minAmount) {
        continue;
      }

      if (typeof q.maxAmount === "number" && order.amount > q.maxAmount) {
        continue;
      }

      result.push(order);
    }

    return result;
  }

  // Метод для отримання статистики по замовленням, який використовується для відображення інформації в UI.
  function stats() {
    const statuses: OrderStatus[] = [
      "new",
      "processing",
      "completed",
      "cancelled",
    ];

    // Підрахунок кількості замовлень для кожного статусу, міста і дня. Це робиться за допомогою індексів, тому працює швидко навіть на великій кількості замовлень.
    const statusCounts = statuses.map((status) => {
      const set = byStatus.get(status);
      return {
        key: status,
        count: set ? set.size : 0,
      };
    });

    return {
      ids: byId.size,
      statuses: statusCounts,
      cities: byCity.size,
      days: byDay.size,
    };
  }

  // Індексування початкових замовлень, якщо вони були передані при створенні стору.
  for (const order of initial) {
    indexOrder(order);
  }

  return {
    get size() {
      return byId.size;
    },
    getById,
    getAll,
    add,
    update,
    remove,
    upsertMany,
    query,
    stats,
  };
}

// Повертає існуючу коллекцію, якщо вона є, або створює нову, зберігає її в мапі і повертає її.
function ensureSet<K>(map: Map<K, Set<string>>, key: K): Set<string> {
  const existing = map.get(key);
  if (existing) {
    return existing;
  }

  const next = new Set<string>();
  map.set(key, next);
  return next;
}

// Видаляє id з множини, яка відповідає ключу в мапі. Якщо множина порожня після видалення, то вона видаляється з мапи.
function deleteFromIndex<K>(map: Map<K, Set<string>>, key: K, id: string) {
  const set = map.get(key);
  if (!set) {
    return;
  }

  set.delete(id);

  if (set.size === 0) {
    map.delete(key);
  }
}

// Додає id до множини, яка відповідає ключу в мапі. Якщо такої множини немає, то вона буде створена.
function addToIndex<K>(map: Map<K, Set<string>>, key: K, id: string) {
  const set = ensureSet(map, key);
  set.add(id);
}

// Ця функція робить перетин (intersection): залишає тільки ті id, які є в усіх sets.
// Тобто це оптимізована “AND-логіка” для фільтрів
// Наприклад, якщо ми хочемо отримати замовлення зі статусом "new" і містом "Kyiv",
// то ми отримаємо множину id замовлень зі статусом "new" і множину id замовлень з міста "Kyiv",
// а потім зробимо перетин цих множин, щоб отримати тільки ті замовлення, які відповідають обом умовам.
function intersectSets(sets: ReadonlyArray<Set<string>>): Set<string> {
  if (sets.length === 0) {
    return new Set<string>();
  }

  const sorted = [...sets].sort((a, b) => a.size - b.size);
  const [smallest, ...rest] = sorted;

  const result = new Set<string>();

  // Проходимо по найменшій множині, і для кожного її елемента перевіряємо, чи є він в усіх інших множинах.
  // Якщо так, то додаємо його в результат.
  for (const id of smallest) {
    let ok = true;

    for (const s of rest) {
      if (!s.has(id)) {
        ok = false;
        break;
      }
    }

    if (ok) {
      result.add(id);
    }
  }

  // тут ми повертаємо тільки ті id, які є в усіх множинах, тобто ті замовлення, які відповідають всім фільтрам,
  // які можна застосувати через індекси (статус і місто).
  return result;
}
