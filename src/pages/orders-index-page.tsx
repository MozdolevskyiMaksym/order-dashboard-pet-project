import { useEffect, useMemo, useState } from "react";

import type { Order, OrderStatus } from "@/shared/types/order";
import { getOrders } from "@/api/orders.api";

import { ALL_STATUSES, STATUS_LABELS } from "@/features/orders/constants";
import { createOrdersIndex } from "@/features/ordersIndex/ordersIndex";
import {
  formatMoney,
  formatMs,
  toggleInList,
  formatIsoToDay,
} from "@/shared/utils";

import "./orders-index-page.scss";

const DEFAULT_STATUSES: ReadonlyArray<OrderStatus> = ["new", "processing"];

type PerfStats = Readonly<{
  indexMs: number;
  plainMs: number;
}>;

type ResultRow = Readonly<{
  id: string;
  createdAtDay: string;
  status: OrderStatus;
  amount: number;
  city: string;
}>;

export default function OrdersIndexPage() {
  const [orders, setOrders] = useState<ReadonlyArray<Order>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [statuses, setStatuses] =
    useState<ReadonlyArray<OrderStatus>>(DEFAULT_STATUSES);

  const [limit, setLimit] = useState<number>(15);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
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
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, []);

  const index = useMemo(() => {
    return createOrdersIndex(orders);
  }, [orders]);

  const plainFiltered = useMemo(() => {
    // Порівняння з “звичайним” підходом: кожен запит робить повний прохід по масиву
    if (statuses.length === 0) {
      return orders;
    }
    return orders.filter((o) => statuses.includes(o.status));
  }, [orders, statuses]);

  const indexFiltered = useMemo(() => {
    // Індексований підхід: запит виконується через попередньо підготовлені структури даних
    return index.query({
      statuses: statuses.length > 0 ? statuses : undefined,
    });
  }, [index, statuses]);

  const perf = useMemo<PerfStats>(() => {
    // Замір робимо в memo, щоб не “шуміти” на кожен рендер
    const runs = 50;

    const t0 = performance.now();
    for (let i = 0; i < runs; i += 1) {
      index.query({
        statuses: statuses.length > 0 ? statuses : undefined,
      });
    }
    const t1 = performance.now();

    const t2 = performance.now();
    let plainResultSize = 0;
    for (let i = 0; i < runs; i += 1) {
      if (statuses.length === 0) {
        plainResultSize += orders.length;
      } else {
        plainResultSize += orders.filter(({ status }) =>
          statuses.includes(status),
        ).length;
      }
    }
    const t3 = performance.now();

    return {
      indexMs: (t1 - t0) / runs,
      plainMs: (t3 - t2) / runs + plainResultSize * 0,
    };
  }, [index, orders, statuses]);

  const rows = useMemo(() => {
    return toRows(indexFiltered);
  }, [indexFiltered]);

  const shownRows = useMemo(() => {
    return rows.slice(0, Math.max(1, limit));
  }, [rows, limit]);

  const selectedLabel = useMemo(() => {
    if (statuses.length === 0) {
      return "All statuses";
    }
    return statuses.map((s) => STATUS_LABELS[s]).join(", ");
  }, [statuses]);

  const mismatch = useMemo(() => {
    // Перевірка коректності: результати мають збігатися (за множиною id)
    const a = new Set(indexFiltered.map(({ id }) => id));
    const b = new Set(plainFiltered.map(({ id }) => id));

    if (a.size !== b.size) {
      return true;
    }

    for (const id of a) {
      if (!b.has(id)) {
        return true;
      }
    }

    return false;
  }, [indexFiltered, plainFiltered]);

  return (
    <div className="orders-index-demo">
      <div className="orders-index-demo__intro">
        <h1 className="orders-index-demo__title">Orders index demo</h1>

        <div className="orders-index-demo__subtitle">
          This page demonstrates an indexed query structure. You can filter by
          statuses and compare the indexed query against a plain array filter.
          The goal is to show how precomputed structures can support fast
          lookups on large collections.
        </div>
      </div>

      <div className="orders-index-demo__card">
        <div className="orders-index-demo__card-header">
          <div className="orders-index-demo__card-title">Query</div>

          <div className="orders-index-demo__card-meta">
            Total orders: {orders.length}
          </div>
        </div>

        <div className="orders-index-demo__spacer orders-index-demo__spacer--10" />

        <div className="orders-index-demo__status-list">
          {ALL_STATUSES.map((s) => {
            const active = statuses.includes(s);

            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatuses((prev) => toggleInList(prev, s));
                }}
                className={
                  active
                    ? "orders-index-demo__status-pill orders-index-demo__status-pill--active"
                    : "orders-index-demo__status-pill"
                }
                aria-pressed={active}
              >
                <span
                  className={
                    active
                      ? "orders-index-demo__status-dot orders-index-demo__status-dot--active"
                      : "orders-index-demo__status-dot"
                  }
                />
                <span>{STATUS_LABELS[s]}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setStatuses([]);
            }}
            className="orders-index-demo__status-pill orders-index-demo__status-pill--clear"
          >
            Clear selection
          </button>
        </div>

        <div className="orders-index-demo__spacer orders-index-demo__spacer--12" />

        <div className="orders-index-demo__section">
          <div className="orders-index-demo__selected">
            Selected:{" "}
            <span className="orders-index-demo__selected-value">
              {selectedLabel}
            </span>
          </div>

          {loading ? (
            <div className="orders-index-demo__loading">Loading…</div>
          ) : null}
          {error ? (
            <div className="orders-index-demo__error">Error: {error}</div>
          ) : null}

          {!loading && !error ? (
            <div className="orders-index-demo__result">
              Result:{" "}
              <span className="orders-index-demo__result-value">
                {indexFiltered.length} / {orders.length}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="orders-index-demo__two-col">
        <div className="orders-index-demo__card">
          <div className="orders-index-demo__card-title">Correctness</div>
          <div className="orders-index-demo__spacer orders-index-demo__spacer--8" />

          <div className="orders-index-demo__text">
            Indexed query result count:{" "}
            <span className="orders-index-demo__strong">
              {indexFiltered.length}
            </span>
            <br />
            Plain filter result count:{" "}
            <span className="orders-index-demo__strong">
              {plainFiltered.length}
            </span>
            <br />
            Match:{" "}
            <span
              className={
                mismatch
                  ? "orders-index-demo__strong orders-index-demo__strong--error"
                  : "orders-index-demo__strong"
              }
            >
              {mismatch ? "No (check implementation)" : "Yes"}
            </span>
          </div>

          <div className="orders-index-demo__spacer orders-index-demo__spacer--10" />

          <div className="orders-index-demo__text-muted">
            If results mismatch, the index query logic is inconsistent with the
            plain filter.
          </div>
        </div>

        <div className="orders-index-demo__card">
          <div className="orders-index-demo__card-title">Performance</div>
          <div className="orders-index-demo__spacer orders-index-demo__spacer--8" />

          <div className="orders-index-demo__text">
            Indexed query avg:{" "}
            <span className="orders-index-demo__strong">
              {formatMs(perf.indexMs, 3)}
            </span>
            <br />
            Plain filter avg:{" "}
            <span className="orders-index-demo__strong">
              {formatMs(perf.plainMs, 3)}
            </span>
          </div>

          <div className="orders-index-demo__spacer orders-index-demo__spacer--10" />

          <div className="orders-index-demo__text-muted">
            This is a lightweight micro-benchmark (averaged over multiple runs).
            It becomes more meaningful with larger datasets.
          </div>
        </div>
      </div>

      <div className="orders-index-demo__card">
        <div className="orders-index-demo__preview-header">
          <div className="orders-index-demo__card-title">Result preview</div>

          <div className="orders-index-demo__rows-control">
            <div className="orders-index-demo__rows-label">Rows:</div>
            <select
              className="orders-index-demo__select"
              value={String(limit)}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next)) {
                  setLimit(next);
                }
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="9999">All</option>
            </select>
          </div>
        </div>

        <div className="orders-index-demo__spacer orders-index-demo__spacer--10" />

        {!loading && !error ? (
          <div className="orders-index-demo__table-wrap">
            <table className="orders-index-demo__table">
              <thead>
                <tr>
                  <th className="orders-index-demo__th">ID</th>
                  <th className="orders-index-demo__th">Date</th>
                  <th className="orders-index-demo__th">Status</th>
                  <th className="orders-index-demo__th">City</th>
                  <th className="orders-index-demo__th">Amount</th>
                </tr>
              </thead>
              <tbody>
                {shownRows.length === 0 ? (
                  <tr>
                    <td className="orders-index-demo__td" colSpan={5}>
                      No results
                    </td>
                  </tr>
                ) : (
                  shownRows.map((r) => (
                    <tr key={r.id}>
                      <td className="orders-index-demo__td">{r.id}</td>
                      <td className="orders-index-demo__td">
                        {r.createdAtDay}
                      </td>
                      <td className="orders-index-demo__td">
                        {STATUS_LABELS[r.status]}
                      </td>
                      <td className="orders-index-demo__td">{r.city}</td>
                      <td className="orders-index-demo__td">
                        {formatMoney(r.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="orders-index-demo__empty">
            Load data to preview results.
          </div>
        )}
      </div>
    </div>
  );
}

function toRows(orders: ReadonlyArray<Order>): ReadonlyArray<ResultRow> {
  return orders.map(({ id, createdAt, status, amount, city }) => ({
    id,
    createdAtDay: formatIsoToDay(createdAt),
    status,
    amount,
    city,
  }));
}
