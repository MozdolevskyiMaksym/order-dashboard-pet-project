export type OrdersStatusChartPoint = Readonly<{
  status: string;
  count: number;
}>;

export type OrdersCityChartPoint = Readonly<{
  city: string;
  count: number;
  totalAmount: number;
  lat: number;
  lng: number;
}>;

export type OrdersAnalytics = Readonly<{
  totalOrders: number;
  totalAmount: number;
  topCity: string;
  byStatus: ReadonlyArray<OrdersStatusChartPoint>;
  byCity: ReadonlyArray<OrdersCityChartPoint>;
}>;
