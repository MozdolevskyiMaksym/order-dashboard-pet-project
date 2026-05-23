import type { Order, OrderStatus } from "@/shared/types/order";

// DTO для створення замовлення (те, що приходить з фронта)
type CreateOrderDto = Omit<Order, "id">;

// Перевіряємо payload, щоб не пускати "сміття" в store(при ствоеренні замовлення). // DTO - data transfer object
export function validateCreateOrderDto(
  payload: unknown,
): CreateOrderDto | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const body = payload as Partial<CreateOrderDto>;

  const isValid =
    typeof body.createdAt === "string" &&
    isOrderStatus(body.status) &&
    typeof body.amount === "number" &&
    Number.isFinite(body.amount) &&
    typeof body.city === "string" &&
    typeof body.lat === "number" &&
    Number.isFinite(body.lat) &&
    typeof body.lng === "number" &&
    Number.isFinite(body.lng);

  if (!isValid) {
    return null;
  }

  return body as CreateOrderDto;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === "new" ||
    value === "processing" ||
    value === "completed" ||
    value === "cancelled"
  );
}
