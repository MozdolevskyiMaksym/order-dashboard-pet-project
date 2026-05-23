import type { OrderStatus } from "@/shared/types/order";
import type { OrdersUiFilter } from "@/features/orders/types/filter";
import { STATUS_LABELS } from "@/features/orders/constants";
import { toggleInList } from "@/features/orders/utils/filterUtils";
import "./orders-filters-panel.scss";

type Props = {
  cities: ReadonlyArray<string>;
  statuses: ReadonlyArray<OrderStatus>;
  filter: OrdersUiFilter;
  onChange: (next: OrdersUiFilter) => void;
  onClear: () => void;
};

export function OrdersFiltersPanel({
  cities,
  statuses,
  filter,
  onChange,
  onClear,
}: Readonly<Props>) {
  return (
    <div className="orders-filters">
      <div className="orders-filters__title">Filters</div>

      {/* Dates */}
      <div className="orders-filters__row">
        <div className="orders-filters__field">
          <div className="orders-filters__label">Date from</div>
          <input
            className="orders-filters__input"
            value={filter.dateFrom}
            onChange={(e) => onChange({ ...filter, dateFrom: e.target.value })}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className="orders-filters__field">
          <div className="orders-filters__label">Date to</div>
          <input
            className="orders-filters__input"
            value={filter.dateTo}
            onChange={(e) => onChange({ ...filter, dateTo: e.target.value })}
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>

      {/* Amount */}
      <div className="orders-filters__row">
        <div className="orders-filters__field">
          <div className="orders-filters__label">Min amount</div>
          <input
            className="orders-filters__input"
            value={filter.minAmount}
            onChange={(e) => onChange({ ...filter, minAmount: e.target.value })}
            placeholder="0"
            inputMode="numeric"
          />
        </div>

        <div className="orders-filters__field">
          <div className="orders-filters__label">Max amount</div>
          <input
            className="orders-filters__input"
            value={filter.maxAmount}
            onChange={(e) => onChange({ ...filter, maxAmount: e.target.value })}
            placeholder="2000"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Status + Cities */}
      <div className="orders-filters__row orders-filters__row--lists">
        <div className="orders-filters__field">
          <div className="orders-filters__label">Statuses</div>

          <div className="orders-filters__options">
            {statuses.map((status) => {
              const checked = filter.selectedStatuses.includes(status);

              return (
                <label key={status} className="orders-filters__option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = toggleInList(
                        filter.selectedStatuses,
                        status,
                      );
                      onChange({ ...filter, selectedStatuses: next });
                    }}
                  />
                  <span>{STATUS_LABELS[status]}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="orders-filters__field">
          <div className="orders-filters__label">Cities</div>

          <select
            className="orders-filters__select"
            multiple
            value={filter.selectedCities}
            onChange={(e) => {
              const next = Array.from(e.target.selectedOptions).map(
                ({ value }) => value,
              );
              onChange({ ...filter, selectedCities: next });
            }}
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <div className="orders-filters__hint">
            Hold Ctrl / Cmd to select multiple
          </div>
        </div>
      </div>

      <div className="orders-filters__actions">
        <button type="button" onClick={onClear}>
          Clear filters
        </button>
      </div>
    </div>
  );
}
