import React, { useState } from "react";
import type { OrderStatus } from "@/shared/types/order";
import { ALL_STATUSES } from "@/features/orders/constants";
import "./create-order-form.scss";

interface Props {
  onCreate: (dto: {
    status: OrderStatus;
    amount: number;
    city: string;
    lat: number;
    lng: number;
  }) => Promise<void> | void;
}

export function CreateOrderForm({ onCreate }: Readonly<Props>) {
  const [status, setStatus] = useState<OrderStatus>("new");
  const [amount, setAmount] = useState<number>(500);
  const [city, setCity] = useState("Kyiv");
  const [lat, setLat] = useState<number>(50.4501); // Координати Києва за замовчуванням
  const [lng, setLng] = useState<number>(30.5234); // Координати Києва за замовчуванням

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSaving(true);
    setError(null);

    try {
      await onCreate({ status, amount, city, lat, lng });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="create-order-form">
      <div className="create-order-form__title">Додати замовлення</div>

      <form onSubmit={handleSubmit} className="create-order-form__form">
        <label className="create-order-form__field">
          <span className="create-order-form__label">Статус</span>
          <select
            className="create-order-form__select"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          >
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="create-order-form__field">
          <span className="create-order-form__label">Сума</span>
          <input
            className="create-order-form__input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>

        <label className="create-order-form__field">
          <span className="create-order-form__label">Місто</span>
          <input
            className="create-order-form__input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>

        <div className="create-order-form__coords">
          <label className="create-order-form__field">
            <span className="create-order-form__label">Lat</span>
            <input
              className="create-order-form__input"
              type="number"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              step="0.0001"
            />
          </label>

          <label className="create-order-form__field">
            <span className="create-order-form__label">Lng</span>
            <input
              className="create-order-form__input"
              type="number"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              step="0.0001"
            />
          </label>
        </div>

        {error ? (
          <div className="create-order-form__error">Помилка: {error}</div>
        ) : null}

        <button
          type="submit"
          className="create-order-form__submit"
          disabled={isSaving}
        >
          {isSaving ? "Зберігаю…" : "Створити"}
        </button>
      </form>
    </div>
  );
}
