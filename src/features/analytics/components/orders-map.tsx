import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

import { formatMoney } from '@/shared/utils';

import type { OrdersCityChartPoint } from '../types';

import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype.options.iconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type OrdersMapProps = Readonly<{
  data: ReadonlyArray<OrdersCityChartPoint>;
}>;

export default function OrdersMap({ data }: OrdersMapProps) {
  return (
    <div className="analytics-page__card analytics-page__card--map">
      <div className="analytics-page__card-title">Orders map</div>

      <div className="analytics-page__map">
        <MapContainer
          center={[49.0, 31.0]}
          zoom={6}
          scrollWheelZoom={false}
          className="analytics-page__map-container"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {data.map((cityData) => (
            <Marker
              key={cityData.city}
              position={[cityData.lat, cityData.lng]}
            >
              <Popup>
                <div className="analytics-page__popup">
                  <strong>{cityData.city}</strong>
                  <div>Orders: {cityData.count}</div>
                  <div>Total amount: ${formatMoney(cityData.totalAmount)}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
