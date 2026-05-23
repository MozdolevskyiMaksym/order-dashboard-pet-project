import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderStatus } from "@/shared/types/order";
import type {
  FilterPreset,
  OrdersUiFilter,
  PresetsState,
} from "@/features/orders/types/filter";

const PRESETS_STORAGE_KEY = "orders.filters.presets.v1";

// Хук для роботи з пресетами фільтрів.
// Він зберігає пресети в localStorage, і дозволяє створювати, видаляти і перейменовувати пресети.
export function useFilterPresets() {
  const [state, setState] = useState<PresetsState>({
    presets: [],
    presetName: "",
    editingPresetId: null,
    editingPresetName: "",
  });

  // При першому рендері завантажуємо пресети з localStorage і зберігаємо їх в стані.
  useEffect(() => {
    setState((prev) => ({ ...prev, presets: loadPresets() }));
  }, []);

  const setPresetName = useCallback((value: string) => {
    setState((prev) => ({ ...prev, presetName: value }));
  }, []);

  const startRename = useCallback((preset: Readonly<FilterPreset>) => {
    setState((prev) => ({
      ...prev,
      editingPresetId: preset.id,
      editingPresetName: preset.name,
    }));
  }, []);

  const cancelRename = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editingPresetId: null,
      editingPresetName: "",
    }));
  }, []);

  const setEditingPresetName = useCallback((value: string) => {
    setState((prev) => ({ ...prev, editingPresetName: value }));
  }, []);

  // Функція для збереження поточного фільтра як пресет.
  // Вона створює новий пресет з унікальним id, і додає його в список пресетів.
  // Потім вона зберігає оновлений список пресетів в localStorage.
  const saveCurrentFilterAsPreset = useCallback(
    (currentFilter: Readonly<OrdersUiFilter>) => {
      const name = state.presetName.trim();
      if (!name) {
        return;
      }

      // Створюємо новий пресет з унікальним id, поточним часом створення і фільтром, який ми хочемо зберегти.
      const preset: FilterPreset = {
        id: generatePresetId(),
        name,
        createdAt: new Date().toISOString(),
        filter: {
          ...currentFilter,
        },
      };

      // Додаємо новий пресет в початок списку пресетів, і зберігаємо оновлений список в localStorage.
      const next = [preset, ...state.presets];
      savePresets(next);

      setState((prev) => ({
        ...prev,
        presets: next,
        presetName: "",
      }));
    },
    [state.presetName, state.presets],
  );

  // Функція для видалення пресета за id.
  // Вона створює новий список пресетів без пресета з вказаним id, і зберігає його в localStorage.
  const deletePreset = useCallback(
    (id: string) => {
      // Створюємо новий список пресетів, який містить всі пресети, крім того, який ми хочемо видалити.
      const next = state.presets.filter(({ id: presetId }) => presetId !== id);
      savePresets(next);

      setState((prev) => ({
        ...prev,
        presets: next,
        editingPresetId:
          prev.editingPresetId === id ? null : prev.editingPresetId,
        editingPresetName:
          prev.editingPresetId === id ? "" : prev.editingPresetName,
      }));
    },
    [state.presets],
  );

  // Функція для збереження нового імені пресета після перейменування.
  const saveRename = useCallback(() => {
    const id = state.editingPresetId;
    if (!id) {
      return;
    }

    // Створюємо новий список пресетів, де пресет з id, який ми хочемо перейменувати,
    // має оновлене ім'я, а інші пресети залишаються без змін.
    const name = state.editingPresetName.trim();
    if (!name) {
      return;
    }
    // Потім зберігаємо оновлений список пресетів в localStorage.
    const next = state.presets.map((preset) => {
      if (preset.id !== id) {
        return preset;
      }

      return {
        ...preset,
        name,
      };
    });

    savePresets(next);

    setState((prev) => ({
      ...prev,
      presets: next,
      editingPresetId: null,
      editingPresetName: "",
    }));
  }, [state.editingPresetId, state.editingPresetName, state.presets]);

  // Пам'ятаємо всі функції і стан в мемоізованому об'єкті, щоб не створювати нові функції при кожному рендері.
  const api = useMemo(() => {
    return {
      state,
      setPresetName,
      startRename,
      cancelRename,
      setEditingPresetName,
      saveCurrentFilterAsPreset,
      deletePreset,
      saveRename,
    };
  }, [
    state,
    setPresetName,
    startRename,
    cancelRename,
    setEditingPresetName,
    saveCurrentFilterAsPreset,
    deletePreset,
    saveRename,
  ]);

  return api;
}

function generatePresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// Безпечний парсинг JSON з localStorage. Якщо дані не є валідним JSON, то повертається null замість того, щоб кинути помилку.
function safeJsonParse(value: string | null): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Функція для перевірки, чи є значення валідним статусом замовлення.
// Це потрібно для того, щоб переконатися, що дані, які ми отримуємо з localStorage, мають правильну структуру
// і не містять некоректних значень.
function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === "new" ||
    value === "processing" ||
    value === "completed" ||
    value === "cancelled"
  );
}

// Функція для перетворення сирого значення з localStorage в масив пресетів.
// Вона перевіряє, що дані мають правильну структуру, і якщо ні, то повертає порожній масив.
function parsePresets(raw: unknown): ReadonlyArray<FilterPreset> {
  if (!Array.isArray(raw)) {
    return [];
  }

  const result: FilterPreset[] = [];

  for (const item of raw) {
    const preset = parsePresetItem(item);
    if (!preset) {
      continue;
    }

    result.push(preset);
  }

  return result;
}

function parsePresetItem(item: unknown): FilterPreset | null {
  if (!isObject(item)) {
    return null;
  }

  const id = typeof item.id === "string" ? item.id : "";
  const name = typeof item.name === "string" ? item.name : "";

  // Якщо немає id або name, то це явно не валідний пресет, і ми його пропускаємо.
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
    filter: parsePresetFilter(item.filter),
  };
}

function parsePresetFilter(raw: unknown): FilterPreset["filter"] {
  const filterRaw = isObject(raw) ? raw : {};

  return {
    selectedStatuses: parseSelectedStatuses(filterRaw.selectedStatuses),
    selectedCities: parseSelectedCities(filterRaw.selectedCities),
    dateFrom: typeof filterRaw.dateFrom === "string" ? filterRaw.dateFrom : "",
    dateTo: typeof filterRaw.dateTo === "string" ? filterRaw.dateTo : "",
    minAmount:
      typeof filterRaw.minAmount === "string" ? filterRaw.minAmount : "",
    maxAmount:
      typeof filterRaw.maxAmount === "string" ? filterRaw.maxAmount : "",
  };
}

function parseSelectedStatuses(raw: unknown): ReadonlyArray<OrderStatus> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isOrderStatus);
}

function parseSelectedCities(raw: unknown): ReadonlyArray<string> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((city): city is string => typeof city === "string");
}

// Функція для завантаження пресетів з localStorage.
// Вона використовує safeJsonParse і parsePresets, щоб отримати масив пресетів, або порожній масив,
// якщо дані в localStorage некоректні.
function loadPresets(): ReadonlyArray<FilterPreset> {
  const raw = safeJsonParse(localStorage.getItem(PRESETS_STORAGE_KEY));
  return parsePresets(raw);
}

// Функція для збереження пресетів в localStorage.
// Вона перетворює масив пресетів в JSON, і зберігає його.
// Якщо пресети не можуть бути перетворені в JSON, то вона просто не зберігає їх, щоб не зіпсувати дані в localStorage.
function savePresets(presets: ReadonlyArray<FilterPreset>): void {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}
