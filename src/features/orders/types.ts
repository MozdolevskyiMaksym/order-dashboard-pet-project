export type OrdersSortKey = "createdAt" | "amount" | "status" | "city";

export type OrdersSort = {
  key: OrdersSortKey;
  direction: "asc" | "desc";
};

export type SortChangePayload = {
  key: OrdersSortKey;
};
