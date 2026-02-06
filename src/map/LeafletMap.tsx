import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './LeafletMap.module.css';
import type { Spot } from '../types';
import type { ReactNode } from 'react';

// Fix default marker icon issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface MapMarker {
  spot: Spot;
  isSelected?: boolean;
  isTemporary?: boolean;
}

interface MapRoute {
  segmentId: string;
  positions: [number, number][];
  color: string;
  width: number;
  isSelected?: boolean;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers: MapMarker[];
  routes: MapRoute[];
  onMarkerClick?: (spot: Spot) => void;
  onRouteClick?: (segmentId: string) => void;
  onMapClick?: (latlng: [number, number]) => void;
  children?: ReactNode;
}

function MapClickHandler({ onClick }: { onClick?: (latlng: [number, number]) => void }) {
  useMapEvents({
    click: (e) => {
      onClick?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

const temporaryIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: styles.temporaryMarker,
});

const selectedIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  className: styles.selectedMarker,
});

export default function LeafletMap({
  center = [39.8283, -98.5795],
  zoom = 4,
  markers,
  routes,
  onMarkerClick,
  onRouteClick,
  onMapClick,
  children,
}: LeafletMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} className={styles.map}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={onMapClick} />

      {markers.map((m) => (
        <Marker
          key={m.spot.id}
          position={m.spot.coordinates}
          icon={m.isTemporary ? temporaryIcon : m.isSelected ? selectedIcon : undefined}
          eventHandlers={{
            click: () => onMarkerClick?.(m.spot),
          }}
        >
          <Popup>{m.spot.name}</Popup>
        </Marker>
      ))}

      {routes.map((r) => (
        <Polyline
          key={r.segmentId}
          positions={r.positions}
          pathOptions={{
            color: r.color,
            weight: r.isSelected ? r.width + 2 : r.width,
            opacity: r.isSelected ? 1 : 0.7,
          }}
          eventHandlers={{
            click: () => onRouteClick?.(r.segmentId),
          }}
        />
      ))}

      {children}
    </MapContainer>
  );
}
