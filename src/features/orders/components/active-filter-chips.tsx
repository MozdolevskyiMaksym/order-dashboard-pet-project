import type { FilterChip } from "../types/filter";
import "./active-filter-chips.scss";

type Props = {
  chips: ReadonlyArray<FilterChip>;
  onClearAll: () => void;
};

export function ActiveFilterChips({ chips, onClearAll }: Readonly<Props>) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="active-filters">
      <div className="active-filters__header">
        <div className="active-filters__title">Active filters</div>

        <button
          type="button"
          className="active-filters__clear"
          onClick={onClearAll}
        >
          Clear all
        </button>
      </div>

      <div className="active-filters__chips">
        {chips.map(({ key, label, onRemove }) => (
          <button
            key={key}
            type="button"
            onClick={onRemove}
            className="active-filters__chip"
            aria-label={`Remove filter: ${label}`}
            title="Click to remove"
          >
            <span className="active-filters__chip-label">{label}</span>
            <span className="active-filters__chip-remove">×</span>
          </button>
        ))}
      </div>
    </div>
  );
}
