import { OrderStatus } from "@/shared/types/order";

export type FiltersAdvancedValue<K extends keyof FiltersAdvancedState> =
  K extends "statuses"
    ? OrderStatus
    : K extends "cities"
      ? string
      : FiltersAdvancedState[K];

export type FiltersAdvancedState = {
  datasetSize: number;
  runs: number;
  statuses: ReadonlyArray<OrderStatus>;
  cities: ReadonlyArray<string>;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
};
