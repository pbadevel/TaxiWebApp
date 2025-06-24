'use client';
import { TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import { useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

import GeoLocationButton from './AutoLocation';

import L, { PointTuple, LatLngExpression} from 'leaflet';
import { useEffect } from 'react';


// Типы для пропсов
interface LocationMarkerProps {
  position: { lat: number; lng: number } | null;
  type: 'start' | 'end';
}

// Новый тип для точки маршрута
interface RouteNode {
  id: string;
  lon: string;
  lat: string;
  s: string;
  zid: string;
}

interface CityBounds {
  id: string;
  bounds: [[number, number], [number, number]]; // [SW, NE]
}


// Компонент для обработки событий карты
const MapHandler = ({ 
  step, 
  onSetPoint,
  onMapMove,
  selectedCityId,
  citiesBounds,
  onPointValidation
  }: { 
    step: 'start' | 'end' | 'tarif'; 
    onSetPoint: (point: { lat: number; lng: number }, address: string) => void;
    onMapMove: (point: { lat: number; lng: number }, address: string) => void;
    selectedCityId: string | null;
    citiesBounds: CityBounds[]; // Передаем границы городов
    onPointValidation: (isValid: boolean) => void; // Колбэк для валидации точки
  }) => {
    const map = useMap();
    const [lastPoint, setLastPoint] = useState<L.LatLng | null>(null);
    const moveTimeout = useRef<NodeJS.Timeout | null>(null);

    const baseApiPath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    const checkPointInCity = (lat: number, lng: number): boolean => {
      if (!selectedCityId) return true;
      
      const city = citiesBounds.find(c => c.id === selectedCityId);
      if (!city) return true;

      const [[swLat, swLon], [neLat, neLon]] = city.bounds;
      return (
        lat >= swLat &&
        lat <= neLat &&
        lng >= swLon &&
        lng <= neLon
      );
    };



    // update address name
    const updateAddress = async (lat: number, lng: number, isClick: boolean = false) => {
      const isValid = checkPointInCity(lat, lng);
      onPointValidation(isValid);

      if (!isValid && isClick) {
        alert('Выбранная точка находится за пределами города');
        return;
      }

      try {

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const response = await fetch(url);
        
        const data = await response.json();

        if (data && data.display_name) {
          
          const address = data.display_name.split(',').slice(0, 4).join(',');
          
          
          if (!isClick && isValid) {
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
      }, 200);
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

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';



  // Кастомные иконки
  const icon = L.icon({
    iconUrl: type === 'start' ? basePath+`/marker-green.png` : basePath+`/marker-red.png`,
    iconSize: [42, 42],
    iconAnchor: [16, 32],
  });

  return <Marker position={position} icon={icon} />;
};

// Компонент для отображения маршрута
const RoutePolyline = ({ nodes }: { nodes: RouteNode[] }) => {
  const map = useMap();
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Преобразуем узлы в массив координат для Polyline с валидацией
  const positions: LatLngExpression[] = nodes
    .map(node => {
      const lat = parseFloat(node.lat);
      const lng = parseFloat(node.lon);
      return { lat, lng };
    })
    .filter(point => 
      !isNaN(point.lat) && 
      !isNaN(point.lng) &&
      point.lat >= -90 && 
      point.lat <= 90 &&
      point.lng >= -180 && 
      point.lng <= 180
    )
    .map(point => [point.lat, point.lng]);

  // Центрируем карту по маршруту с учетом блока тарифов
  useEffect(() => {
    if (positions.length > 0 && map) {
      // 1. Рассчитываем границы маршрута
      const bounds = L.latLngBounds(positions);
      
      // 2. Получаем контейнер карты для расчета высоты
      const mapContainer = map.getContainer();
      if (!mapContainer) return;
      
      const offsetCenter = [
        [bounds.getNorthWest().lat, bounds.getNorthWest().lng - window.innerWidth/2 - 100],
        [bounds.getSouthEast().lat, bounds.getNorthWest().lng]
      ];
     
      map.flyToBounds(bounds, {
        paddingTopLeft: offsetCenter[0] as PointTuple,
        paddingBottomRight: offsetCenter[1] as PointTuple
      })
      
      setMapInitialized(true);
    }
  }, [positions, map]);

  // Обновление при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      if (positions.length > 0 && mapInitialized) {
        const bounds = L.latLngBounds(positions);
        const mapContainer = map.getContainer();
        
        if (!mapContainer) return;
        
        const offsetCenter = [
        [bounds.getNorthWest().lat, bounds.getNorthWest().lng - 200],
        [bounds.getSouthEast().lat, bounds.getNorthWest().lng]
      ];
     
      map.flyToBounds(bounds, {
        paddingTopLeft: offsetCenter[0] as PointTuple,
        paddingBottomRight: offsetCenter[1] as PointTuple
      })
      
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [positions, map, mapInitialized]);

  // Не рендерим полилинию, если нет валидных точек
  if (positions.length === 0) return null;

  return <Polyline 
    positions={positions} 
    color="#3b82f6" 
    weight={6}
    opacity={0.8}
  />;
};

interface RouteMapProps {
  center: L.LatLngExpression;
  startPoint: { lat: number; lng: number } | null;
  endPoint: { lat: number; lng: number } | null;
  step: 'start' | 'end' | 'tarif';
  onSetPoint: (point: { lat: number; lng: number }, address: string) => void;
  onMapMove: (point: { lat: number; lng: number }, address: string) => void;
  onMapLoad: (map: L.Map) => void;
  routeNodes?: RouteNode[]; // Добавим пропс для точек маршрута
  selectedCityId: string | null;
  citiesBounds: CityBounds[]; // Передаем границы городов
  onPointValidation: (isValid: boolean) => void; // Колбэк для валидации точки
}


// Главный компонент
export default function RouteMap({ 
  center, 
  startPoint, 
  endPoint,
  step,
  onSetPoint,
  onMapMove,
  onMapLoad,
  routeNodes = [],
  selectedCityId,
  citiesBounds,
  onPointValidation
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
        selectedCityId={selectedCityId}
        citiesBounds={citiesBounds}
        onPointValidation={onPointValidation}
      />
      
      <LocationMarker position={step === 'end' || step === 'tarif' ? startPoint: null} type="start" />
      <LocationMarker position={step === 'tarif' ? endPoint : null} type="end" />

      {/* Добавляем кнопку геолокации */}
      <GeoLocationButton onLocationFound={handleLocationFound} />

      {/* Отображаем маршрут, если есть точки */}
      {routeNodes.length > 0 && <RoutePolyline nodes={routeNodes} />}
    </>
  );
} 