// components/RouteMap.tsx
'use client';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import styles from './RouteMap.module.css';

// Типы для пропсов
interface LocationMarkerProps {
  position: L.LatLngExpression | null;
  type: 'start' | 'end';
}

interface MapEventsProps {
  setPoint: (point: L.LatLng) => void;
}

interface RouteMapProps {
  startPoint: L.LatLngExpression | null;
  endPoint: L.LatLngExpression | null;
  setStartPoint: (point: L.LatLng) => void;
  setEndPoint: (point: L.LatLng) => void;
}

const LocationMarker = ({ position, type }: LocationMarkerProps) => {
  // Создаем кастомную иконку с классом для стилизации
  const icon = L.icon({
    iconUrl: '/next.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    className: type === 'start' ? styles.startMarker : styles.endMarker,
  });

  // icon={icon}
  return position ? <Marker position={position}  /> : null;
};

const MapEvents = ({ setPoint }: MapEventsProps) => {
  useMapEvents({
    click(e) {
      setPoint(e.latlng);
    }
  });
  return null;
};

export default function RouteMap({ 
  startPoint, 
  endPoint, 
  setStartPoint, 
  setEndPoint 
}: RouteMapProps) {
  const center: L.LatLngExpression = [55.751244, 37.618423]; // Москва по умолчанию
  
  return (
    <MapContainer 
      center={center} 
      zoom={13}
      className={styles.mapContainer}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      <MapEvents setPoint={setStartPoint} />
      <LocationMarker position={startPoint} type="start" />
      <LocationMarker position={endPoint} type="end" />
    </MapContainer>
  );
}