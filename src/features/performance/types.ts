import type { OrderStatus } from "@/shared/types/order";

export type PerformanceQuery = Readonly<{
  statuses: ReadonlyArray<OrderStatus>;
  cities: ReadonlyArray<string>;
  dateFrom: string; // YYYY-MM-DD або ""
  dateTo: string; // YYYY-MM-DD або ""
  minAmount: number | undefined;
  maxAmount: number | undefined;
}>;

export type BenchmarkResult = Readonly<{
  datasetSize: number;
  runs: number;

  naiveMs: number;
  optimizedMs: number;

  speedup: number;

  cacheHits: number;
  cacheMisses: number;
}>;

export type RunResult = Readonly<{
  naiveMs: number;
  optimizedMs: number;
  speedup: number;
  filteredCount: number;
  totalAmount: number;
}>;

export type DatasetSize = 1000 | 10000 | 50000;

export type PerfFilter = Readonly<{
  statuses: ReadonlyArray<OrderStatus>;
  cities: ReadonlyArray<string>;
  minAmount?: number;
  maxAmount?: number;
}>;

export type PerfAggregateResult = Readonly<{
  filteredCount: number;
  totalAmount: number;
  byStatus: ReadonlyArray<Readonly<{ status: OrderStatus; count: number }>>;
}>;

export type MeasureResult<T> = Readonly<{
  ms: number;
  result: T;
}>;

export type FiltersState = {
  size: DatasetSize;
  statuses: ReadonlyArray<OrderStatus>;
  cities: ReadonlyArray<string>;
  minAmount: string;
  maxAmount: string;
};

export type FilterValue<K extends keyof FiltersState> = K extends "statuses"
  ? OrderStatus
  : K extends "cities"
    ? string
    : FiltersState[K];

export type PerfPoint = Readonly<{
  size: number;
  naiveMs: number;
  optimizedMs: number;
}>;
