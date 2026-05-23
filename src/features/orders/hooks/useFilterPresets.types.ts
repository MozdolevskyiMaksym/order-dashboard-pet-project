import type { FilterPreset, OrdersUiFilter } from "../types/filter";

export type PresetsState = Readonly<{
  presets: FilterPreset[];
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
