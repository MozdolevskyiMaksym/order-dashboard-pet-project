import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Order } from "@/shared/types/order";

// Важний імпорт для правильних іконок маркерів у Webpack
import L from "leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { formatMoney } from "@/shared/utils";

type Props = {
  orders: Order[];
  height?: number;
};

// Фікс іконок: Leaflet за замовчуванням не знаходить картинки у збірці
const defaultIcon = L.icon({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function OrdersMap({ orders, height = 360 }: Readonly<Props>) {
  // Центр карти: якщо є дані — беремо перший елемент, інакше дефолт
  const center = useMemo<[number, number]>(() => {
    if (!orders.length) {
      return [49, 31];
    } // приблизний центр України
    return [orders[0].lat, orders[0].lng];
  }, [orders]);

  if (!orders.length) {
    return (
      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        No data available for display on the map
      </div>
    );
  }

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Orders on the map</div>

      <div style={{ width: "100%", height }}>
        <MapContainer
          center={center}
          zoom={6}
          style={{ width: "100%", height: "100%", borderRadius: 8 }}
          scrollWheelZoom={true}
        >
          {/* Тайли OpenStreetMap (без ключів) */}
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {orders.map((o) => (
            <Marker key={o.id} position={[o.lat, o.lng]} icon={defaultIcon}>
              <Popup>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>
                    <b>{o.id}</b>
                  </div>
                  <div>City: {o.city}</div>
                  <div>Status: {o.status}</div>
                  <div>
                    Amount:{" "}
                    {formatMoney(o.amount, {
                      locale: "uk-UA",
                      currency: "UAH",
                    })}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {new Date(o.createdAt).toLocaleString("uk-UA")}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
