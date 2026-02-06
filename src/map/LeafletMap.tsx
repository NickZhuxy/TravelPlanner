import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './markerStyles.css';
import styles from './LeafletMap.module.css';
import { createNormalIcon, createTemporaryIcon, createSelectedIcon } from './customMarkers';
import AddSpotPopup from '../components/AddSpotPopup';
import type { Spot, Day } from '../types';
import type { ReactNode } from 'react';

interface MapMarker {
  spot: Spot;
  isSelected?: boolean;
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
  flyToLocation?: [number, number] | null;
  pendingMarker?: [number, number] | null;
  pendingSpotInfo?: { name: string; address: string } | null;
  days?: Day[];
  onAddSpot?: (dayId?: string) => void;
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

function MapController({ flyToLocation }: { flyToLocation?: [number, number] | null }) {
  const map = useMap();
  const prevLocation = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (
      flyToLocation &&
      (prevLocation.current?.[0] !== flyToLocation[0] ||
        prevLocation.current?.[1] !== flyToLocation[1])
    ) {
      map.flyTo(flyToLocation, 14, { duration: 1.2 });
      prevLocation.current = flyToLocation;
    }
  }, [flyToLocation, map]);

  return null;
}

function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  return null;
}

const temporaryIcon = createTemporaryIcon();

function PendingMarker({
  position,
  info,
  days,
  onAddSpot,
}: {
  position: [number, number];
  info: { name: string; address: string };
  days: Day[];
  onAddSpot: (dayId?: string) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      markerRef.current?.openPopup();
    }, 100);
    return () => clearTimeout(timer);
  }, [position]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={temporaryIcon}
    >
      <Popup closeButton={false}>
        <AddSpotPopup
          name={info.name}
          address={info.address}
          days={days}
          onAddUndecided={() => onAddSpot()}
          onAddToDay={(dayId) => onAddSpot(dayId)}
        />
      </Popup>
    </Marker>
  );
}

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function LeafletMap({
  center = [39.8283, -98.5795],
  zoom = 4,
  markers,
  routes,
  flyToLocation,
  pendingMarker,
  pendingSpotInfo,
  days = [],
  onAddSpot,
  onMarkerClick,
  onRouteClick,
  onMapClick,
  children,
}: LeafletMapProps) {
  const [zoomLevel, setZoomLevel] = useState(zoom);

  const normalSize = clamp(10, 10 + zoomLevel, 24);
  const selectedSize = Math.round(normalSize * 1.33);

  const normalIcon = useMemo(() => createNormalIcon(normalSize), [normalSize]);
  const selectedIcon = useMemo(() => createSelectedIcon(selectedSize), [selectedSize]);

  return (
    <MapContainer center={center} zoom={zoom} className={styles.map}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={onMapClick} />
      <MapController flyToLocation={flyToLocation} />
      <ZoomWatcher onZoomChange={setZoomLevel} />

      {markers.map((m) => (
        <Marker
          key={m.spot.id}
          position={m.spot.coordinates}
          icon={m.isSelected ? selectedIcon : normalIcon}
          eventHandlers={{
            click: () => onMarkerClick?.(m.spot),
          }}
        />
      ))}

      {pendingMarker && pendingSpotInfo && onAddSpot && (
        <PendingMarker
          position={pendingMarker}
          info={pendingSpotInfo}
          days={days}
          onAddSpot={onAddSpot}
        />
      )}

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
