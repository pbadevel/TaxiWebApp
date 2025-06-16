'use client';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import styles from './RouteMap.module.css';
import L, { LatLng } from 'leaflet';
import { useEffect } from 'react';


// Типы для пропсов
interface LocationMarkerProps {
  position: L.LatLngExpression | null;
  type: 'start' | 'end';
}

interface RouteMapProps {
  center: L.LatLngExpression;
  startPoint: { lat: number; lng: number } | null;
  endPoint: { lat: number; lng: number } | null;
  step: 'start' | 'end';
  onSetPoint: (point: { lat: number; lng: number }, address: string) => void;
  onMapLoad: (map: L.Map) => void;
}

// Компонент для обработки событий карты
const MapHandler = ({ 
  step, 
  onSetPoint,
  map
}: { 
  step: 'start' | 'end'; 
  onSetPoint: (point: { lat: number; lng: number }, address: string) => void;
  map: L.Map;
}) => {
  // Обработчик перемещения карты
  const handleMove = () => {
    const center = map.getCenter();
    updateAddress(center.lat, center.lng);
  };

  // Обработчик клика по карте
  const handleClick = (e: L.LeafletMouseEvent) => {
    onSetPoint({ lat: e.latlng.lat, lng: e.latlng.lng }, 'Выбранное место');
  };

  // Функция для получения адреса по координатам
  const updateAddress = async (lat: number, lng: number) => {
  try {
    const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
    const data = await response.json();

    if (data && data.display_name) {
      const address = data.display_name.split(',').slice(0, 4).join(',');
      onSetPoint({ lat, lng }, address);
    }
  } catch (error) {
    console.error('Ошибка получения адреса:', error);
  }
};

  useEffect(() => {
    map.on('moveend', handleMove);
    if (step === 'start') {
      map.on('click', handleClick);
    } else {
      map.off('click', handleClick);
    }

    // Инициализация адреса
    const center = map.getCenter();
    updateAddress(center.lat, center.lng);

    return () => {
      map.off('moveend', handleMove);
      map.off('click', handleClick);
    };
  }, [step]);

  return null;
};

const LocationMarker = ({ position, type }: LocationMarkerProps) => {
  if (!position) return null;
  
  // Кастомные иконки
  const icon = L.icon({
    iconUrl: type === 'start' ? '/marker-green.png' : '/marker-red.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  return <Marker position={position} icon={icon} />;
};

export default function RouteMap({ 
  center, 
  startPoint, 
  endPoint,
  step,
  onSetPoint,
  onMapLoad
}: RouteMapProps) {
  const map = useMap();
  
  // Передаем экземпляр карты в родительский компонент
  useEffect(() => {
    onMapLoad(map);
  }, [map, onMapLoad]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      <MapHandler 
        step={step} 
        onSetPoint={onSetPoint}
        map={map}
      />
      
      <LocationMarker position={startPoint} type="start" />
      <LocationMarker position={endPoint} type="end" />

    </>
  );
} 