import type { Order, OrderStatus } from "@/shared/types/order";
import type { OrdersSort, OrdersSortKey } from "./types";
import { JSX } from "react";
import "./OrdersTable.scss";
import { formatMoney } from "@/shared/utils";
import { formatDate, getNextSort, getStatusPillColors } from "./utils";
import { STATUS_LABELS } from "./constants";

type Props = {
  orders: Order[];
  sort: OrdersSort;
  onSortChange: (next: OrdersSort) => void;
  isLoading?: boolean;
  error?: string | null;
};

const HEADER_CELLS: ReadonlyArray<
  Readonly<{
    label: string;
    sortKey: OrdersSortKey;
  }>
> = [
  { label: "Created at", sortKey: "createdAt" },
  { label: "Status", sortKey: "status" },
  { label: "Amount", sortKey: "amount" },
  { label: "City", sortKey: "city" },
];

export function OrdersTable({
  orders,
  sort,
  onSortChange,
  isLoading,
  error,
}: Readonly<Props>) {
  const renderContent = (): JSX.Element => {
    if (isLoading) {
      return <div className="orders-table__loading">Loading…</div>;
    }

    if (error) {
      return <div className="orders-table__error">Error: {error}</div>;
    }

    if (orders.length === 0) {
      return <div className="orders-table__empty">No orders found.</div>;
    }

    return (
      <div className="orders-table__scroll">
        <table className="orders-table__table">
          <thead>
            <tr className="orders-table__head-row">
              {HEADER_CELLS.map(({ label, sortKey }) => (
                <HeaderCell
                  key={sortKey}
                  label={label}
                  sortKey={sortKey}
                  onSortChange={onSortChange}
                  sort={sort}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {orders.map(({ id, createdAt, status, amount, city }) => (
              <tr key={id} className="orders-table__row">
                <td className="orders-table__cell orders-table__cell--nowrap">
                  {formatDate(createdAt)}
                </td>
                <td className="orders-table__cell">
                  <StatusPill status={status} />
                </td>
                <td className="orders-table__cell orders-table__cell--right">
                  {formatMoney(amount, { currency: "USD" })}
                </td>
                <td className="orders-table__cell">{city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="orders-table">
      <div className="orders-table__title">Orders</div>
      {renderContent()}
    </section>
  );
}

function HeaderCell({
  label,
  sortKey,
  sort,
  onSortChange,
}: Readonly<{
  label: string;
  sortKey: OrdersSortKey;

  sort: OrdersSort;
  onSortChange: (next: OrdersSort) => void;
}>) {
  return (
    <th
      onClick={() => onSortChange(getNextSort(sort, sortKey))}
      className="orders-table__header-cell"
    >
      <span className="orders-table__header-content">
        {label}
        <SortIcon active={sort.key === sortKey} direction={sort.direction} />
      </span>
    </th>
  );
}

function SortIcon({
  active,
  direction,
}: Readonly<{
  active: boolean;
  direction: "asc" | "desc";
}>) {
  if (!active) {
    return (
      <span className="orders-table__sort-icon orders-table__sort-icon--inactive">
        ⇅
      </span>
    );
  }
  return (
    <span className="orders-table__sort-icon">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

function StatusPill({ status }: Readonly<{ status: OrderStatus }>) {
  const { background, border } = getStatusPillColors(status);

  return (
    <span
      className="orders-table__pill"
      style={{
        border: `1px solid ${border}`,
        background,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
