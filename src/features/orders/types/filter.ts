import type { OrderStatus } from "@/shared/types/order";

export type OrdersUiFilter = Readonly<{
  selectedStatuses: ReadonlyArray<OrderStatus>;
  selectedCities: ReadonlyArray<string>;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}>;

export type OrdersQueryInput = Readonly<{
  statuses?: ReadonlyArray<OrderStatus>;
  cities?: ReadonlyArray<string>;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}>;

export type FilterPreset = Readonly<{
  id: string;
  name: string;
  createdAt: string;
  filter: OrdersUiFilter;
}>;

export type PresetsState = Readonly<{
  presets: ReadonlyArray<FilterPreset>;
  presetName: string;
  editingPresetId: string | null;
  editingPresetName: string;
}>;

export type PresetsApi = {
  state: PresetsState;
  setPresetName: (value: string) => void;
  startRename: (preset: FilterPreset) => void;
  cancelRename: () => void;
  setEditingPresetName: (value: string) => void;
  saveCurrentFilterAsPreset: (currentFilter: OrdersUiFilter) => void;
  deletePreset: (id: string) => void;
  saveRename: () => void;
};

export type FilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};
