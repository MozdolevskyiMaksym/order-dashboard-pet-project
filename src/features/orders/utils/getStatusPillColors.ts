import type { OrderStatus } from "@/shared/types/order";

export function getStatusPillColors(status: OrderStatus) {
  switch (status) {
    case "completed":
      return { background: "#e8f5e9", border: "#81c784" };
    case "processing":
      return { background: "#e3f2fd", border: "#64b5f6" };
    case "new":
      return { background: "#f3e5f5", border: "#ba68c8" };
    case "cancelled":
    default:
      return {
        background: "#ffebee",
        border: "#e57373",
      };
  }
}
