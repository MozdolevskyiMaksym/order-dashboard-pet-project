import type { FilterPreset, PresetsApi } from "@/features/orders/types/filter";

import "./filter-presets-panel.scss";

type Props = Readonly<{
  presetsApi: PresetsApi;
  onApply: (preset: Readonly<FilterPreset>) => void;
  onSavePreset: () => void;
  onClear: () => void;
}>;

export function FilterPresetsPanel({
  presetsApi,
  onApply,
  onSavePreset,
  onClear,
}: Props) {
  const {
    state,
    setPresetName,
    startRename,
    cancelRename,
    setEditingPresetName,
    saveRename,
    deletePreset,
  } = presetsApi;
  const { presets, presetName, editingPresetId, editingPresetName } = state;
  return (
    <div className="filter-presets">
      <div className="filter-presets__title">Filter presets</div>

      <div className="filter-presets__controls">
        <input
          className="filter-presets__input"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="Preset name"
        />

        <button
          type="button"
          onClick={onSavePreset}
          disabled={presetName.trim().length === 0}
        >
          Save preset
        </button>

        <button type="button" onClick={onClear}>
          Clear filters
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="filter-presets__empty">
          No presets yet. Save your current filters to reuse them later.
        </div>
      ) : (
        <div className="filter-presets__list">
          {presets.map((preset) => {
            const isEditing = editingPresetId === preset.id;
            const { id, name, createdAt } = preset;

            return (
              <div key={id} className="filter-presets__item">
                <div className="filter-presets__item-info">
                  {isEditing ? (
                    <input
                      className="filter-presets__input"
                      value={editingPresetName}
                      onChange={(e) => setEditingPresetName(e.target.value)}
                      placeholder="Preset name"
                    />
                  ) : (
                    <div className="filter-presets__item-title">{name}</div>
                  )}

                  <div className="filter-presets__item-meta">
                    {createdAt
                      ? `Created: ${new Date(createdAt).toLocaleString()}`
                      : ""}
                  </div>
                </div>

                <div className="filter-presets__item-actions">
                  <button
                    type="button"
                    onClick={() => onApply(preset)}
                    disabled={isEditing}
                  >
                    Apply
                  </button>

                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveRename}
                        disabled={editingPresetName.trim().length === 0}
                      >
                        Save
                      </button>

                      <button type="button" onClick={cancelRename}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => startRename(preset)}>
                      Rename
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deletePreset(id)}
                    disabled={isEditing}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
