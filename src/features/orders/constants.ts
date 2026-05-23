import type { OrderStatus } from "@/shared/types/order";

export const ALL_STATUSES: ReadonlyArray<OrderStatus> = [
  "new",
  "processing",
  "completed",
  "cancelled",
];

export const ALL_CITIES: ReadonlyArray<string> = [
  "Kyiv",
  "Lviv",
  "Dnipro",
  "Odesa",
  "Kharkiv",
  "Zaporizhzhia",
  "Poltava",
  "Cherkasy",
  "Kremenchuk",
];

export const STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  new: "New",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<string, string> = {
  new: "#8884d8",
  processing: "#82ca9d",
  completed: "#4caf50",
  cancelled: "#f44336",
};
