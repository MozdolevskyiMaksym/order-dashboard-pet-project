export type OrderStatus = "new" | "processing" | "completed" | "cancelled";

export type Order = {
  id: string;
  createdAt: string; // ISO дата
  status: OrderStatus;
  amount: number;
  city: string;
  lat: number;
  lng: number;
};
