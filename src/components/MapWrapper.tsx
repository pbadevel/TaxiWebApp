'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import styles from '../styles/page.module.css';

import AddressSearchModal from './AddressSearchModal'; // Новый компонент
import TariffSelection from './TariffSelection'; // Новый компонент
import { updateCitiesWithTariffs } from '@/utils/updateCitiesWithTariffs';

import { getDistanceTariff } from '@/utils/tariffCalculator';
import shuffleArray from '@/utils/Shuffle';



interface Tariff {
  id: number;
  name: string;
  price: number;
  time: string;
  icon: string;
  distance: string;
  nodes: any
}

interface Point {
  lat: number;
  lng: number;
}

interface TariffOption {
  tariffId: number;
  name: string;
}

interface City {
  id: string;
  name: string;
  coords: [number, number];
  operatorUnitId?: string; // Новое поле для ID из API
  tariffs?: TariffOption[];
}


declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}



// Динамическая загрузка всех картографических компонентов
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);

const RouteMap = dynamic(() => import('../components/RouteMap'), {
  ssr: false,
  loading: () => <p>Загрузка карты...</p>
});

interface CityBounds {
  id: string;
  bounds: [[number, number], [number, number]]; // [SW, NE]
}
interface ApiTariff {
  id: string;
  title: string;
  // Добавьте другие поля из ответа API при необходимости
}
interface ApiUnit {
  id: string;
  title: string;
  tarifs: ApiTariff[];
}
interface ApiTariffsResponse {
  result: string;
  error: string;
  units: ApiUnit[];
}


const initialCities: City[] = [
  { id: "53", name: "Симферополь", coords: [44.95212, 34.10242], tariffs: [{tariffId: 147, name:"Эконом"}, ]},
  { id: "52", name: "Красноярск", coords: [56.0153, 92.8932], tariffs: [{tariffId: 57, name:"Эконом"}, {tariffId: 123, name:"Комфорт"}, {tariffId: 124, name:"Комфорт+"}, {tariffId: 125, name:"Минивэн"}]},
  { id: "51", name: "Белгород", coords: [50.595, 36.5873], tariffs: [{tariffId: 56, name:"Эконом"}, {tariffId: 141, name:"Комфорт"}, {tariffId: 142, name:"Комфорт+"}, {tariffId: 143, name:"Минивэн"}]},
  { id: "50", name: "Пятигорск", coords: [44.0486, 43.0594], tariffs: [{tariffId: 55, name:"Эконом"}, {tariffId: 154, name:"Комфорт"}, {tariffId: 155, name:"Комфорт+"}, {tariffId: 156, name:"Минивэн"}]},
  { id: "49", name: "Архангельск", coords: [64.5393, 40.5187], tariffs: [{tariffId: 54, name:"Эконом"}, {tariffId: 86, name:"Комфорт"}, {tariffId: 87, name:"Комфорт+"}]},
  { id: "48", name: "Ставрополь", coords: [45.0445, 41.969], tariffs: [{tariffId: 53, name:"Эконом"}, {tariffId: 91, name:"Комфорт"}, {tariffId: 92, name:"Комфорт+"}, {tariffId: 93, name:"Минивэн"}]},
  { id: "47", name: "Рязань", coords: [54.6194, 39.7449], tariffs: [{tariffId: 52, name:"Эконом"}, {tariffId: 94, name:"Комфорт"}, {tariffId: 95, name:"Комфорт+"}, {tariffId: 96, name:"Минивэн"}]},
  { id: "45", name: "Подольск (Моск)", coords: [55.4242, 37.5547], tariffs: [{tariffId: 51, name:"Оптимал"}]},
  { id: "44", name: "Астрахань", coords: [46.3479, 48.0336], tariffs: [{tariffId: 50, name:"Эконом"}, {tariffId: 135, name:"Комфорт"}, {tariffId: 136, name:"Комфорт+"}, {tariffId: 137, name:"Минивэн"}]},
  { id: "43", name: "Киров (Киров, обл)", coords: [58.6036, 49.668], tariffs: [{tariffId: 49, name:"Эконом"}, {tariffId: 117, name:"Комфорт"}, {tariffId: 118, name:"Комфорт+"}, {tariffId: 119, name:"Минивэн"}]},
  { id: "42", name: "Ижевск", coords: [56.8527, 53.2115], tariffs: [{tariffId: 48, name:"Эконом"}]},
  { id: "41", name: "Пенза", coords: [53.195, 45.0183], tariffs: [{tariffId: 46, name:"Эконом"}, {tariffId: 97, name:"Комфорт"}, {tariffId: 98, name:"Комфорт+"}, {tariffId: 99, name:"Минивэн"}]},
  { id: "40", name: "Ульяновск", coords: [54.3142, 48.4031], tariffs: [{tariffId: 45, name:"Оптимал"}]},
  { id: "39", name: "Липецк", coords: [52.6088, 39.5992], tariffs: [{tariffId: 44, name:"Эконом"}, {tariffId: 129, name:"Комфорт"}, {tariffId: 131, name:"Комфорт+"}, {tariffId: 130, name:"Минивэн"}]},
  { id: "38", name: "Томск", coords: [56.4846, 84.9476], tariffs: [{tariffId: 43, name:"Эконом"}, {tariffId: 120, name:"Комфорт"}, {tariffId: 121, name:"Комфорт+"}, {tariffId: 122, name:"Минивэн"}]},
  { id: "37", name: "Барнаул", coords: [53.3561, 83.7496], tariffs: [{tariffId: 42, name:"Эконом"}, {tariffId: 84, name:"Комфорт"}, {tariffId: 85, name:"Комфорт+"}]},
  { id: "36", name: "Балашиха (Моск. обл)", coords: [55.8094, 37.9581], tariffs: [{tariffId: 41, name:"Оптимал"}]},
  { id: "35", name: "Набережные Челны", coords: [55.7436, 52.3958], tariffs: [{tariffId: 40, name:"Оптимал"}]},
  { id: "34", name: "Новокузнецк (Кемер. обл)", coords: [53.7865, 87.1552], tariffs: [{tariffId: 39, name:"Эконом"}, {tariffId: 82, name:"Комфорт"}, {tariffId: 83, name:"Комфорт+"}]},
  { id: "33", name: "Вологда", coords: [59.2205, 39.8915], tariffs: [{tariffId: 38, name:"Оптимал"}]},
  { id: "32", name: "Брянск", coords: [53.2434, 34.3642], tariffs: [{tariffId: 37, name:"Эконом"}, {tariffId: 132, name:"Комфорт"}, {tariffId: 133, name:"Комфорт+"}, {tariffId: 134, name:"Минивэн"}]},
  { id: "31", name: "Магнитогорск", coords: [53.4117, 58.9844], tariffs: [{tariffId: 34, name:"Оптимал"}]},
  { id: "30", name: "Саратов", coords: [51.5924, 45.9608], tariffs: [{tariffId: 33, name:"Эконом"}, {tariffId: 109, name:"Комфорт"}, {tariffId: 110, name:"Комфорт+"}, {tariffId: 111, name:"Минивэн"}]},
  { id: "29", name: "Ярославль", coords: [57.6261, 39.8845], tariffs: [{tariffId: 32, name:"Эконом"}, {tariffId: 100, name:"Комфорт"}, {tariffId: 101, name:"Комфорт+"}, {tariffId: 102, name:"Минивэн"}]},
  { id: "28", name: "Крым", coords: [45.3561, 36.4674], tariffs: [{tariffId: 31, name:"Эконом"}, {tariffId: 103, name:"Комфорт"}, {tariffId: 104, name:"Комфорт+"}, {tariffId: 105, name:"Минивэн"}]},
  { id: "27", name: "Тюмень", coords: [57.153, 65.5343], tariffs: [{tariffId: 30, name:"Эконом"}, {tariffId: 144, name:"Комфорт"}, {tariffId: 145, name:"Комфорт+"}, {tariffId: 146, name:"Минивэн"}]},
  { id: "26", name: "Сочи", coords: [43.5855, 39.7231], tariffs: [{tariffId: 29, name:"Эконом"}, {tariffId: 157, name:"Комфорт"}, {tariffId: 158, name:"Комфорт+"}]},
  { id: "25", name: "Иркутск", coords: [52.2896, 104.2806], tariffs: [{tariffId: 23, name:"Эконом"}, {tariffId: 106, name:"Комфорт"}, {tariffId: 107, name:"Комфорт+"}, {tariffId: 108, name:"Минивэн"}]},
  { id: "24", name: "Севастополь", coords: [44.6166, 33.5254], tariffs: [{tariffId: 22, name:"Эконом"}, {tariffId: 152, name:"Комфорт"}, {tariffId: 151, name:"Комфорт+"}, {tariffId: 153, name:"Минивэн"}]},
  { id: "23", name: "Краснодар", coords: [45.0355, 38.9753], tariffs: [{tariffId: 21, name:"Эконом"}, {tariffId: 78, name:"Комфорт"}, {tariffId: 79, name:"Комфорт+"}]},
  { id: "22", name: "Оренбург", coords: [51.7682, 55.097], tariffs: [{tariffId: 20, name:"Эконом"}, {tariffId: 138, name:"Комфорт"}, {tariffId: 139, name:"Комфорт+"}, {tariffId: 140, name:"Минивэн"}]},
  { id: "21", name: "Великий Новгород", coords: [58.5228, 31.2698], tariffs: [{tariffId: 19, name:"Эконом"}, {tariffId: 126, name:"Комфорт"}, {tariffId: 127, name:"Комфорт+"}, {tariffId: 128, name:"Минивэн"}]},
  { id: "20", name: "Москва", coords: [55.751244, 37.618423], tariffs: [{tariffId: 9, name:"Оптимал"}]},
  { id: "19", name: "Челябинск", coords: [55.1598, 61.4025], tariffs: [{tariffId: 18, name:"Эконом"}, {tariffId: 113, name:"Комфорт"}, {tariffId: 114, name:"Комфорт+"}, {tariffId: 115, name:"Минивэн"}]},
  { id: "18", name: "Нижний Новгород", coords: [56.3269, 44.0075], tariffs: [{tariffId: 17, name:"Эконом"}, {tariffId: 76, name:"Комфорт"}, {tariffId: 77, name:"Комфорт+"}, {tariffId: 112, name:"Минивэн"}]},
  { id: "17", name: "Новосибирск", coords: [55.0084, 82.9357], tariffs: [{tariffId: 10, name:"Эконом"}, {tariffId: 74, name:"Комфорт"}, {tariffId: 75, name:"Комфорт+"}]},
  { id: "16", name: "Пермь", coords: [58.0105, 56.2294], tariffs: [{tariffId: 16, name:"Оптимал"}]},
  { id: "15", name: "Волгоград", coords: [48.7071, 44.517], tariffs: [{tariffId: 15, name:"Эконом"}, {tariffId: 72, name:"Комфорт"}, {tariffId: 73, name:"Комфорт+"},]},
  { id: "14", name: "Хабаровск", coords: [48.4802, 135.0719], tariffs: [{tariffId: 14, name:"Эконом"}, {tariffId: 88, name:"Комфорт"}, {tariffId: 89, name:"Комфорт+"}]},
  { id: "13", name: "Екатеринбург", coords: [56.838, 60.5975], tariffs: [{tariffId: 13, name:"Эконом"}, {tariffId: 70, name:"Комфорт"}, {tariffId: 71, name:"Комфорт+"}]},
  { id: "12", name: "Тольятти", coords: [53.5078, 49.4204], tariffs: [{tariffId: 12, name:"Оптимал"}]},
  { id: "11", name: "Воронеж", coords: [51.6608, 39.2003], tariffs: [{tariffId: 11, name:"Оптимал"}]},
  { id: "10", name: "Уфа", coords: [54.7351, 55.9587], tariffs: [{tariffId: 8, name:"Эконом"}, {tariffId: 66, name:"Комфорт"}, {tariffId: 69, name:"Комфорт+"}]},
  { id: "9", name: "Кемерово", coords: [55.3547, 86.0884], tariffs: [{tariffId: 7, name:"Эконом"}, {tariffId: 67, name:"Комфорт"}, {tariffId: 68, name:"Комфорт+"}]},
  { id: "8", name: "Казань", coords: [55.7963, 49.1088], tariffs: [{tariffId: 6, name:"Оптимал"}]},
  { id: "7", name: "Владивосток", coords: [43.1155, 131.8855], tariffs: [{tariffId: 5, name:"Эконом"}, {tariffId: 64, name:"Комфорт"}, {tariffId: 65, name:"Комфорт+"}]},
  { id: "6", name: "Омск", coords: [54.9914, 73.3645], tariffs: [{tariffId: 4, name:"Эконом"}, {tariffId: 62, name:"Комфорт"}, {tariffId: 63, name:"Комфорт+"}]},
  { id: "5", name: "Ростов-на Дону", coords: [47.222, 39.7203], tariffs: [{tariffId: 3, name:"Эконом"}, {tariffId: 60, name:"Комфорт"}, {tariffId: 61, name:"Комфорт+"}]},
  { id: "4", name: "Санкт-Петербург", coords: [59.934280, 30.335098], tariffs: [{tariffId: 2, name:"Эконом"}, {tariffId: 58, name:"Комфорт"}, {tariffId: 59, name:"Комфорт+"}]}
];
const citiesBounds: CityBounds[] = [
  { id: "53", bounds: [[44.75, 33.85], [45.15, 34.35]] }, // Симферополь
  { id: "52", bounds: [[55.80, 92.60], [56.30, 93.20]] }, // Красноярск
  { id: "51", bounds: [[50.45, 36.40], [50.75, 36.80]] }, // Белгород
  { id: "50", bounds: [[43.95, 42.95], [44.15, 43.15]] }, // Пятигорск
  { id: "49", bounds: [[64.40, 40.30], [64.70, 40.80]] }, // Архангельск
  { id: "48", bounds: [[44.90, 41.80], [45.20, 42.10]] }, // Ставрополь
  { id: "47", bounds: [[54.50, 39.55], [54.75, 39.95]] }, // Рязань
  { id: "45", bounds: [[55.35, 37.40], [55.50, 37.70]] }, // Подольск (Моск)
  { id: "44", bounds: [[46.20, 47.80], [46.50, 48.20]] }, // Астрахань
  { id: "43", bounds: [[58.45, 49.50], [58.75, 49.80]] }, // Киров (Киров, обл)
  { id: "42", bounds: [[56.70, 53.00], [57.00, 53.40]] }, // Ижевск
  { id: "41", bounds: [[53.10, 44.90], [53.30, 45.10]] }, // Пенза
  { id: "40", bounds: [[54.20, 48.20], [54.40, 48.60]] }, // Ульяновск
  { id: "39", bounds: [[52.50, 39.40], [52.70, 39.80]] }, // Липецк
  { id: "38", bounds: [[56.35, 84.75], [56.60, 85.15]] }, // Томск
  { id: "37", bounds: [[53.20, 83.55], [53.50, 83.95]] }, // Барнаул
  { id: "36", bounds: [[55.75, 37.80], [55.90, 38.10]] }, // Балашиха (Моск. обл)
  { id: "35", bounds: [[55.65, 52.25], [55.85, 52.55]] }, // Набережные Челны
  { id: "34", bounds: [[53.65, 86.95], [53.90, 87.35]] }, // Новокузнецк (Кемер. обл)
  { id: "33", bounds: [[59.10, 39.70], [59.35, 40.10]] }, // Вологда
  { id: "32", bounds: [[53.10, 34.20], [53.35, 34.50]] }, // Брянск
  { id: "31", bounds: [[53.30, 58.80], [53.50, 59.20]] }, // Магнитогорск
  { id: "30", bounds: [[51.45, 45.80], [51.75, 46.10]] }, // Саратов
  { id: "29", bounds: [[57.50, 39.70], [57.75, 40.10]] }, // Ярославль
  { id: "28", bounds: [[44.20, 33.50], [45.50, 37.50]] }, // Крым (весь полуостров)
  { id: "27", bounds: [[56.95, 65.35], [57.35, 65.75]] }, // Тюмень
  { id: "26", bounds: [[43.40, 39.50], [43.80, 39.95]] }, // Сочи
  { id: "25", bounds: [[52.15, 104.10],[52.40, 104.45]]}, // Иркутск
  { id: "24", bounds: [[44.50, 33.30], [44.75, 33.75]] }, // Севастополь
  { id: "23", bounds: [[44.95, 38.80], [45.15, 39.15]] }, // Краснодар
  { id: "22", bounds: [[51.65, 54.90], [51.90, 55.30]] }, // Оренбург
  { id: "21", bounds: [[58.40, 31.10], [58.65, 31.45]] }, // Великий Новгород
  { id: "20", bounds: [[55.40, 36.90], [56.10, 38.35]] }, // Москва
  { id: "19", bounds: [[55.05, 61.20], [55.25, 61.60]] }, // Челябинск
  { id: "18", bounds: [[56.20, 43.80], [56.45, 44.20]] }, // Нижний Новгород
  { id: "17", bounds: [[54.85, 82.75], [55.15, 83.15]] }, // Новосибирск
  { id: "16", bounds: [[57.90, 56.05], [58.15, 56.40]] }, // Пермь
  { id: "15", bounds: [[48.55, 44.30], [48.85, 44.75]] }, // Волгоград
  { id: "14", bounds: [[48.35, 134.90], [48.60, 135.20]] }, // Хабаровск
  { id: "13", bounds: [[56.70, 60.40], [56.95, 60.80]] }, // Екатеринбург
  { id: "12", bounds: [[53.35, 49.25], [53.65, 49.60]] }, // Тольятти
  { id: "11", bounds: [[51.50, 39.00], [51.75, 39.40]] }, // Воронеж
  { id: "10", bounds: [[54.60, 55.80], [54.85, 56.10]] }, // Уфа
  { id: "9", bounds: [[55.25, 85.95], [55.45, 86.20]] }, // Кемерово
  { id: "8", bounds: [[55.70, 48.95], [55.90, 49.25]] }, // Казань
  { id: "7", bounds: [[43.00, 131.75], [43.25, 132.00]] }, // Владивосток
  { id: "6", bounds: [[54.85, 73.20], [55.15, 73.50]] }, // Омск
  { id: "5", bounds: [[47.10, 39.50], [47.35, 39.90]] }, // Ростов-на Дону
  { id: "4", bounds: [[59.70, 29.80], [60.15, 30.85]] }, // Санкт-Петербург
];






export default function CustomMapWrapper() {
  const [cities, setCities] = useState<City[]>(initialCities);
   const [selectedCityId, setSelectedCityId] = useState<string>(initialCities.find(c => c.name === "Санкт-Петербург")?.id || '4')
  // const [selectedCity, setSelectedCity] = useState<City>(initialCities.find(c => c.name === "Санкт-Петербург") || initialCities[0]);
  const [pointValid, setPointValid] = useState(true);

  const [step, setStep] = useState<'start' | 'end' | 'tarif'>('start');
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  
  const [startAddress, setStartAddress] = useState<string>('Выберите место посадки');
  const [endAddress, setEndAddress] = useState<string>('Выберите место прибытия');
  const [showTariff, setShowTariff] = useState<boolean>(false);
  
  const [address, setAddress] = useState<string>('Выберите место');

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [currentAddressType, setCurrentAddressType] = useState<'start' | 'end' | "tarif">('start');

  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedTariffs, setCalculatedTariffs] = useState<Tariff[]>([]);
  const [routeNodes, setRouteNodes] = useState<any[]>([]); 

  const moveTimeout = useRef<NodeJS.Timeout | null>(null);
  


  const [tg, setTg] = useState<any>(null);


  const selectedCity = cities.find(city => city.id === selectedCityId) || cities[0];
  

  useEffect(() => {
    const fetchTariffs = async () => {
      try {
        const response = await fetch(basePath + '/api/tariffs');
        const apiData: ApiTariffsResponse = await response.json();
        const updatedCities = updateCitiesWithTariffs(initialCities, apiData);
        setCities(updatedCities);
      } catch (error) {
        console.error('Ошибка при обновлении тарифов:', error);
      }
    };

    fetchTariffs();
    initializeTelegram();
    
  }, []);

  const initializeTelegram = useCallback(async () => {
    try {
      const WebApp = window.Telegram?.WebApp
      
      setTg(WebApp);

      if (!WebApp) throw new Error('Telegram WebApp not available');
      
      await WebApp.ready();
      WebApp.expand();

    
    } catch (error) {
      console.error('Initialization error:', error);
      // setLoading(false);
    }
    return null;
  }, []);


  useEffect(() => {
    if (step === 'tarif' && startPoint && endPoint) {
      calculatePrices();
    }
  }, [step]);

  function sortTariffs(tariffs: Tariff[]): Tariff[] {
  const priorityOrder = ["Эконом", "Комфорт", "Комфорт+", "Минивэн"];

  return tariffs.slice().sort((a, b) => {
    // Нормализуем названия для сравнения (удаляем лишние пробелы и символы)
    const normalize = (name: string) => name.replace(/\s+/g, '');
    
    const aName = normalize(a.name);
    const bName = normalize(b.name);
    
    const aIndex = priorityOrder.findIndex(p => normalize(p) === aName);
    const bIndex = priorityOrder.findIndex(p => normalize(p) === bName);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}


  const calculatePrices = async () => {
  if (!startPoint || !endPoint) return;
  
  setIsCalculating(true);
  setRouteNodes([]);
  
  const points: [number, number][] = [
    [startPoint.lng, startPoint.lat],
    [endPoint.lng, endPoint.lat]
  ];
  
  try {
    const cars = ['🚕', "🚗", "🏎", "🚕", "🚖", '🚘', '🚙'];
    shuffleArray(cars);
    
    // Создаем промисы для всех тарифов
    const tariffPromises = selectedCity.tariffs?.map((tariff, index) => 
      getDistanceTariff(selectedCity.id, tariff.tariffId, points)
        .then(response => ({
          id: tariff.tariffId,
          name: tariff.name,
          icon: cars[index % cars.length],
          price: parseInt(response.fix_price) || 0,
          time: getEstimatedTime(response.distance),
          distance: response.distance + " км" || '0 км',
          nodes: response.nodes
        }))
        .catch(error => {
          console.error(`Error for tariff ${tariff.name}:`, error);
          return null;
        })
    ) || [];

    // Ждем выполнения всех промисов
    const tariffResults = await Promise.all(tariffPromises);
    
    // Фильтруем успешные результаты
    const validTariffs = tariffResults.filter(t => t !== null) as Tariff[];
    
    // Проверяем нулевую дистанцию
    if (validTariffs.length > 0 && validTariffs[0].distance === "0 км") {
      try {
        tg?.showAlert('Слишком маленькая дистанция, попробуйте еще раз.', () => {});
      } catch {
        alert("Слишком маленькая дистанция, попробуйте еще раз.");
      }
      setShowTariff(false);
      resetPoints();
      return;
    }
    
    // Устанавливаем маршрут
    if (validTariffs.length > 0 && validTariffs[0].nodes) {
      console.log(validTariffs[0].nodes)
      setRouteNodes(validTariffs[0].nodes);
    }
    
    // Сортируем тарифы
    const sortedTariffs = sortTariffs(validTariffs);
    setCalculatedTariffs(sortedTariffs);
    setShowTariff(true);
    
  } catch (error) {
    console.error('Failed to calculate tariffs:', error);
    setShowTariff(false);
    alert('Ошибка расчета стоимости. Попробуйте снова.');
    setStep('end');
  } finally {
    setIsCalculating(false);
  }
};

  const getEstimatedTime = (distance: number) => {
    // Средняя скорость 50 км/ч + 5 минут на подачу
    const minutes = Math.round((distance / 50) * 60) + 5;
    return `${minutes} мин`;
  };

  // Обработчик смены города
   const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    setSelectedCityId(cityId);
    
    const city = cities.find(c => c.id === cityId);
    if (city && mapRef.current) {
      mapRef.current.panTo(city.coords, 15);
    }
  };

  // Обработчик выбора точки
  const handleSetPoint = (point: Point, addr: string) => {
    console.log(point)
    if (step === 'start') {
      setStartPoint(point);
      setStartAddress(addr);
    } else if (step === 'end') {
      setEndPoint(point);
      setEndAddress(addr);
    } else if (step === 'tarif') {
      // После выбора точки прибытия показываем тарифы useEffect
    }
  };

  // Обработчик возврата к карте
  const handleBackToMap = () => {
    resetPoints();
    setShowTariff(false);
    setStep('start');
  };


  const handleMapMove = (point: Point, addr: string) => {
      setAddress(addr);
  };

  // Обработчик открытия модального окна
const handleModalAddressClick = (type: 'start' | 'end' | 'tarif') => {
      setCurrentAddressType(type);
      setIsAddressModalOpen(true);
  };

  // Обработчик выбора адреса из модального окна
  const handleAddressSelect = (coords: { lat: number; lng: number }) => {

      setIsAddressModalOpen(false);
      
      // Центрируем карту на выбранном адресе
      if (mapRef.current) {
      mapRef.current.flyTo([coords.lat, coords.lng], 16);
      }
  };

  
  // Сброс точек
  const resetPoints = () => {
    setStartPoint(null);
    setEndPoint(null);
    setStep('start');
    setAddress('Выберите место');
    setRouteNodes([]); // Очищаем точки маршрута
  };

  // Передача ссылки на карту
  const handleMapLoad = (mapInstance: any) => {
      mapRef.current = mapInstance;
  };


  const handleOrderTaxi = (tariffId: number, paymentMethod: "cash" | "card", specialRequests: string[], finalPrice: string) => {
    console.log('Заказ такси с тарифом:', tariffId, paymentMethod, specialRequests);
    
    const orderData = JSON.stringify({
      startPoint: startPoint ? [startPoint.lng, startPoint.lat] : null,
      endPoint: endPoint ? [endPoint.lng, endPoint.lat] : null,

      startAddress,
      endAddress,
      
      tariffId,
      uintId: selectedCity.id,
      options: specialRequests,
      finalPrice,
      
      paymentMethod,
    });

    
    // Если в Telegram - отправляем через WebApp API
    console.log(tg)
    if (tg) {
      try {
        tg.sendData(JSON.stringify(orderData));
        tg.showAlert('Продолжите оформление заказа в телеграмме!', () => {
          tg.close();
        });
      } catch (error) {
        console.error('Ошибка отправки данных:', error);
        alert('Ошибка оформления заказа');
      }
    } else {
      // Режим отладки вне Telegram
      console.log('Order data:', orderData);
      alert('Заказ оформлен! (в режиме отладки)');
    }

    // Сбрасываем состояние
    setShowTariff(false);
    resetPoints();
  };



  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';





  return (
  <>
    {!showTariff && <div className={styles.cityPanel}>
      <select 
        value={selectedCityId}
        onChange={handleCityChange}
        className={styles.citySelect}
      >
        {[...cities].sort((a, b) => a.name.localeCompare(b.name)).map(city => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </div> 
    }

    {/* Центральный маркер */}
    {!showTariff && step !== 'tarif'  && (
        <div className={styles.centerMarker}>
          <div className={styles.markerLabel}>
            <div className={styles.markerRow}>
              <div className={styles.markerTitle}>
                {step === 'start' ? 'Посадка' : 'Прибытие'}
              </div>
              
              {/* Кликабельный адрес */}
              <div 
                className={styles.markerAddress}
                onClick={() => handleModalAddressClick(step)}
              > {address}
              </div>
              
            </div>
            
            {/* Кнопка "Продолжить" */}
            <button 
              className={styles.continueButton}
              onClick={(e) => {
                e.stopPropagation();

                if (step === 'start') {
                  setStep('end');
                } else if (step === 'end') {
                  setStep('tarif');
                }
              }}
              
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <img
            src={step === 'start' ? basePath+'/marker-green.png' : basePath+'/marker-red.png'}
            alt="marker"
            style={{ width: 50, height: 50 }}
          />
        </div>
      )
    }

    {/* Индикатор загрузки */}
    {isCalculating && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Расчет стоимости...</p>
        </div>
      )}

     {/* Блок выбора тарифа */}
      {showTariff && (
        <TariffSelection 
          startAddress={startAddress}
          endAddress={endAddress}
          onBack={handleBackToMap}
          onOrder={handleOrderTaxi}
          tariffs={calculatedTariffs} // Передаем рассчитанные тарифы
        />
      )}


    {/* Модальное окно для поиска адреса */}
    {isAddressModalOpen && step != 'tarif' && (
      <AddressSearchModal
        key={selectedCity.id}
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelectAddress={handleAddressSelect}
        addressType={currentAddressType}
        currentAddress={address}
        currentCityBounds={citiesBounds.find(c => c.id === selectedCity.id)?.bounds}
        unitId={selectedCity.id}
      />
    )}
  
  <div ref={mapContainerRef} className={styles.mapOffset}>
    <MapContainer 
        center={selectedCity.coords} 
        zoom={13} 
        style={{ 
          height: '100vh', 
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0
        }}
      >
        <RouteMap 
          key={selectedCity.id} // Добавляем ключ для принудительного обновления
          center={selectedCity.coords}
          startPoint={startPoint}
          endPoint={endPoint}
          step={step}
          onSetPoint={handleSetPoint}
          onMapMove={handleMapMove}
          onMapLoad={handleMapLoad}
          routeNodes={routeNodes} 
          selectedCityId={selectedCity.id}
          citiesBounds={citiesBounds}
          onPointValidation={setPointValid}
        />
      </MapContainer>
    
  </div>

    
  </>
  );

}