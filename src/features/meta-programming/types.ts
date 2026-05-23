import type { Order, OrderStatus } from "@/shared/types/order";

export type MetaProgrammingApi = Readonly<{
  fetchOrders: (
    input: Readonly<{ statuses?: ReadonlyArray<OrderStatus> }>,
  ) => Promise<ReadonlyArray<Order>>;
  getOrderById: (id: string) => Promise<Order>;
}>;

export type MetaProgrammingLogEntry = Readonly<{
  id: string;
  ts: string;
  text: string;
}>;

export type MetaProgrammingEvents = {
  "orders:loaded": Readonly<{ count: number; source: "proxy" | "memoize" }>;
  error: Readonly<{ message: string }>;
};

export type LoggedProxyOptions = Readonly<{
  label: string;
  logger: Logger;
  includeArgs?: boolean;
}>;

export type Logger = Readonly<{
  log: (message: string) => void;
}>;

// Тип для опцій функції memoize, яка приймає функцію та повертає її мемоізовану версію з додатковими методами для роботи з кешем
export type MemoizeOptions<TArgs extends ReadonlyArray<unknown>> = Readonly<{
  keyFn?: (args: TArgs) => string;
  maxEntries?: number;
}>;

// НЕ Readonly — ми будемо дописувати методи після створення функції.
export type MemoizedFn<TArgs extends ReadonlyArray<unknown>, TResult> = ((
  ...args: TArgs
) => TResult) & {
  cacheSize: () => number;
  cacheClear: () => void;
  cacheHits: () => number;
  cacheMisses: () => number;
};

export type EventMap = Record<string, unknown>;

export type TypedEmitter<TEvents extends EventMap> = Readonly<{
  on: <K extends keyof TEvents>(
    event: K,
    handler: (payload: TEvents[K]) => void,
  ) => () => void;
  emit: <K extends keyof TEvents>(event: K, payload: TEvents[K]) => void;
}>;
