'use client';
import { TileLayer, Marker, useMap } from 'react-leaflet';
import { useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import styles from './RouteMap.module.css';

import GeoLocationButton from './AutoLocation';

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
  step: 'start' | 'end' | 'tarif ';
  onSetPoint: (point: { lat: number; lng: number }, address: string) => void;
  onMapMove: (point: { lat: number; lng: number }, address: string) => void;
  onMapLoad: (map: L.Map) => void;
}

// Компонент для обработки событий карты
const MapHandler = ({ 
  step, 
  onSetPoint,
  onMapMove
  }: { 
    step: 'start' | 'end' | 'tarif '; 
    onSetPoint: (point: { lat: number; lng: number }, address: string) => void;
    onMapMove: (point: { lat: number; lng: number }, address: string) => void;
  }) => {
    const map = useMap();
    const [lastPoint, setLastPoint] = useState<L.LatLng | null>(null);
    const moveTimeout = useRef<NodeJS.Timeout | null>(null);

    const baseApiPath = process.env.NEXT_PUBLIC_BASE_PATH || '';



    // update address name
    const updateAddress = async (lat: number, lng: number, isClick: boolean = false) => {
      try {
        const response = await fetch(`${baseApiPath}/api/reverse-geocode?lat=${lat}&lon=${lng}`);
        const data = await response.json();

        if (data && data.display_name) {
          
          const address = data.display_name.split(',').slice(0, 4).join(',');
          console.log('Адрес:', address);
          
          // Для кликов - устанавливаем точку
          if (!isClick) {
            
            onSetPoint({ lat, lng }, address);
            onMapMove({ lat, lng }, address);
            
          } 
          }
      } catch (error) {
        console.error('Ошибка получения адреса:', error);
      }
    };




    // Обработчик клика по карте
    const handleClick = (e: L.LeafletMouseEvent) => {
      const currentCenter = map.getCenter()
      console.log(currentCenter.lat, currentCenter.lng)
      updateAddress(currentCenter.lat, currentCenter.lng, true);
    };
    
    // Обработчик перемещения карты
    const handleMove = () => {
      if (moveTimeout.current) {
        clearTimeout(moveTimeout.current);
      }
      
      moveTimeout.current = setTimeout(() => {
        const center = map.getCenter();
        // Проверяем, действительно ли карта переместилась
        if (!lastPoint || center.distanceTo(lastPoint) > 50) {
          updateAddress(center.lat, center.lng);
          setLastPoint(center);
        }
      }, 100);
    };

    // Функция для получения адреса по координатам
    useEffect(() => {
    map.on('click', handleClick);
    map.on('moveend', handleMove);

    // Первоначальная установка адреса
    const center = map.getCenter();
    updateAddress(center.lat, center.lng);

    return () => {
      map.off('click', handleClick);
      map.off('moveend', handleMove);
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
    };
  }, [step]);

  return null;

};

const LocationMarker = ({ position, type }: LocationMarkerProps) => {
  if (!position) return null;

  const baseImagePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  
  // Кастомные иконки
  const icon = L.icon({
    iconUrl: type === 'start' ? `${baseImagePath}/marker-green.png` : `${baseImagePath}/marker-red.png`,
    iconSize: [42, 42],
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
  onMapMove,
  onMapLoad
}: RouteMapProps) {
  const map = useMap();
  
  // Передаем экземпляр карты в родительский компонент
  useEffect(() => {
    onMapLoad(map);
  }, [map, onMapLoad]);

  const handleLocationFound = (position: [number, number]) => {
    // Можно использовать для установки точки
    console.log('Location found:', position);
  };

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      <MapHandler 
        step={step} 
        onSetPoint={onSetPoint}
        onMapMove={onMapMove}
      />
      
      <LocationMarker position={startPoint} type="start" />
      <LocationMarker position={endPoint} type="end" />
      {/* Добавляем кнопку геолокации */}
      <GeoLocationButton onLocationFound={handleLocationFound} />

    </>
  );
} 