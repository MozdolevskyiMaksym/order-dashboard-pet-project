import { useEffect, useMemo, useState } from "react";

import type { Order } from "@/shared/types/order";
import { getOrders } from "@/api/orders.api";

import { OrdersTable } from "@/features/orders/OrdersTable";
import type { OrdersSort } from "@/features/orders/types";
import { sortOrders } from "@/features/orders/utils/sortOrders";

import { ALL_STATUSES, STATUS_LABELS } from "@/features/orders/constants";
import type {
  OrdersUiFilter,
  OrdersQueryInput,
  FilterChip,
} from "@/features/orders/types/filter";
import {
  isValidDay,
  toNumberOrUndefined,
  uniqueSorted,
} from "@/features/orders/utils/filterUtils";
import { formatMoney } from "@/shared/utils";

import { createOrdersStore } from "@/features/ordersStore/ordersStore";

import { OrdersFiltersPanel } from "@/features/orders/components/orders-filters-panel";
import { ActiveFilterChips } from "@/features/orders/components/active-filter-chips";
import { FilterPresetsPanel } from "@/features/orders/components/filter-presets-panel";
import { useFilterPresets } from "@/features/orders/hooks/useFilterPresets";

import "./orders-page.scss";

const EMPTY_FILTER: OrdersUiFilter = {
  selectedStatuses: [],
  selectedCities: [],
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<ReadonlyArray<Order>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<OrdersUiFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<OrdersSort>({
    key: "createdAt",
    direction: "desc",
  });

  const presets = useFilterPresets();

  // Завантажуємо замовлення при першому рендері. Показуємо індикатор завантаження, і якщо сталася помилка, то показуємо її.
  useEffect(() => {
    // Якщо компонент розмонтується до того, як прийде відповідь від сервера,
    // то ми не будемо намагатися оновити стан розмонтованого компонента.
    // Це допомагає уникнути помилок типу "Can't perform a React state update on an unmounted component".
    let alive = true;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getOrders({ statuses: [...ALL_STATUSES] });
        if (alive) {
          setOrders(data);
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, []);

  const cities = useMemo(() => {
    return uniqueSorted(orders.map((o) => o.city));
  }, [orders]);

  const store = useMemo(() => {
    return createOrdersStore(orders);
  }, [orders]);

  const stats = useMemo(() => {
    return store.stats();
  }, [store]);

  // buildQueryInput і buildChips — це функції, які перетворюють дані з фільтра в формат, зручний для запитів до сервера і для відображення в UI.
  const { query, safe } = useMemo(() => {
    return buildQueryInput(filter);
  }, [filter]);

  // orders.filter кожного разу ганяє весь масив
  // store може робити це швидше (через підготовлені індекси, Set/Map) — це якраз вклад у “complex data structures” і “performance”
  const rows = useMemo(() => {
    return store.query(query);
  }, [store, query]);

  const sortedOrders = useMemo(() => {
    return sortOrders(rows, sort);
  }, [rows, sort]);

  const chips = useMemo(() => {
    return buildChips(filter, safe, (updater) => {
      setFilter((prev) => updater(prev));
    });
  }, [filter, safe]);

  console.log("query: ", query); // щоб показати як виглядають дані.

  return (
    <div className="orders-page">
      <div className="orders-page__header">
        <h1 className="orders-page__title">Orders</h1>

        <div className="orders-page__count">
          Showing {sortedOrders.length} / {orders.length}
        </div>
      </div>

      <div className="orders-page__stats">
        <div className="orders-page__stats-card">
          <div className="orders-page__stats-label">Total orders</div>
          <div className="orders-page__stats-value">{stats.ids}</div>
        </div>

        <div className="orders-page__stats-card">
          <div className="orders-page__stats-label">Unique cities</div>
          <div className="orders-page__stats-value">{stats.cities}</div>
        </div>

        <div className="orders-page__stats-card">
          <div className="orders-page__stats-label">Unique days</div>
          <div className="orders-page__stats-value">{stats.days}</div>
        </div>

        {stats.statuses.map((s) => (
          <div key={s.key} className="orders-page__stats-card">
            <div className="orders-page__stats-label">{s.key}</div>
            <div className="orders-page__stats-value">{s.count}</div>
          </div>
        ))}
      </div>

      <OrdersFiltersPanel
        cities={cities}
        statuses={ALL_STATUSES}
        filter={filter}
        onChange={(next) => setFilter(next)}
        onClear={() => setFilter(EMPTY_FILTER)}
      />

      <ActiveFilterChips
        chips={chips}
        onClearAll={() => setFilter(EMPTY_FILTER)}
      />

      <FilterPresetsPanel
        presetsApi={presets}
        onApply={(preset) => setFilter(preset.filter)}
        onSavePreset={() => presets.saveCurrentFilterAsPreset(filter)}
        onClear={() => setFilter(EMPTY_FILTER)}
      />

      <OrdersTable
        orders={sortedOrders}
        sort={sort}
        onSortChange={setSort}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

// "технічний" формат для фільтрації
// Він відрізняється від того, що ми показуємо користувачу в UI і приймаємо від нього через форми.
// Наприклад, в UI ми можемо дозволити користувачу ввести некоректну дату, але при цьому не включати її в запит до сервера,
// щоб запит не ламався через некоректні дані.
function buildQueryInput(filter: Readonly<OrdersUiFilter>): Readonly<{
  query: OrdersQueryInput;
  // Ці дані ми будемо використовувати для відображення активних фільтрів в UI, і вони можуть бути некоректними,
  safe: Readonly<{
    dateFromSafe: string;
    dateToSafe: string;
    minAmountNumber: number | undefined;
    maxAmountNumber: number | undefined;
  }>;
}> {
  // Валідуємо і перетворюємо дані з фільтра в більш зручний для роботи формат
  const dateFromSafe = isValidDay(filter.dateFrom) ? filter.dateFrom : ""; // Якщо дата не валідна, то замість неї буде пустий рядок
  const dateToSafe = isValidDay(filter.dateTo) ? filter.dateTo : ""; // Якщо дата не валідна, то замість неї буде пустий рядок

  // Якщо сума не є валідним числом, то замість неї буде undefined
  const minAmountNumber = toNumberOrUndefined(filter.minAmount);
  const maxAmountNumber = toNumberOrUndefined(filter.maxAmount);

  // Якщо в фільтрі є невалідні дані, то в запиті їх не буде, і вони не вплинуть на результати.
  // Але при цьому ми зможемо показати їх користувачу і дозволити виправити.
  const query: OrdersQueryInput = {
    statuses:
      filter.selectedStatuses.length > 0 ? filter.selectedStatuses : undefined,
    cities:
      filter.selectedCities.length > 0 ? filter.selectedCities : undefined,
    dateFrom: dateFromSafe,
    dateTo: dateToSafe,
    minAmount: minAmountNumber,
    maxAmount: maxAmountNumber,
  };

  // undefined означає: “фільтр вимкнений”, а не “некоректне значення”, тому що некоректне значення ми просто не включаємо в запит.

  return {
    query,
    // Ці дані ми будемо використовувати для відображення активних фільтрів в UI, і вони можуть бути некоректними,
    safe: {
      dateFromSafe,
      dateToSafe,
      minAmountNumber,
      maxAmountNumber,
    },
  };
}

function buildChips(
  filter: Readonly<OrdersUiFilter>,
  safe: Readonly<{
    dateFromSafe: string;
    dateToSafe: string;
    minAmountNumber: number | undefined;
    maxAmountNumber: number | undefined;
  }>,
  setFilter: (updater: (prev: OrdersUiFilter) => OrdersUiFilter) => void,
): ReadonlyArray<FilterChip> {
  const items: FilterChip[] = [];

  for (const status of filter.selectedStatuses) {
    items.push({
      key: `status:${status}`,
      label: `Status: ${STATUS_LABELS[status]}`,
      onRemove: () => {
        setFilter((prev) => ({
          ...prev,
          selectedStatuses: prev.selectedStatuses.filter(
            (prevSelectedStatus) => prevSelectedStatus !== status,
          ),
        }));
      },
    });
  }

  for (const city of filter.selectedCities) {
    items.push({
      key: `city:${city}`,
      label: `City: ${city}`,
      onRemove: () => {
        setFilter((prev) => ({
          ...prev,
          selectedCities: prev.selectedCities.filter(
            (prevSelectedCity) => prevSelectedCity !== city,
          ),
        }));
      },
    });
  }

  if (safe.dateFromSafe) {
    items.push({
      key: `dateFrom:${safe.dateFromSafe}`,
      label: `From: ${safe.dateFromSafe}`,
      onRemove: () => {
        setFilter((prevFilter) => ({
          ...prevFilter,
          dateFrom: "",
        }));
      },
    });
  }

  if (safe.dateToSafe) {
    items.push({
      key: `dateTo:${safe.dateToSafe}`,
      label: `To: ${safe.dateToSafe}`,
      onRemove: () => {
        setFilter((prevFilter) => ({
          ...prevFilter,
          dateTo: "",
        }));
      },
    });
  }

  if (safe.minAmountNumber != null) {
    items.push({
      key: `min:${safe.minAmountNumber}`,
      label: `Min: ${formatMoney(safe.minAmountNumber)}`,
      onRemove: () => {
        setFilter((prevFilter) => ({
          ...prevFilter,
          minAmount: "",
        }));
      },
    });
  }

  if (safe.maxAmountNumber != null) {
    items.push({
      key: `max:${safe.maxAmountNumber}`,
      label: `Max: ${formatMoney(safe.maxAmountNumber)}`,
      onRemove: () => {
        setFilter((prevFilter) => ({
          ...prevFilter,
          maxAmount: "",
        }));
      },
    });
  }

  return items;
}
