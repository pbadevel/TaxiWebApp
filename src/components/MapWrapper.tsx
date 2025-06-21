'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from '../styles/page.module.css';

import { useTelegramWebApp } from '@/utils/telegramUtils';


import AddressSearchModal from './AddressSearchModal'; // Новый компонент
import TariffSelection from './TariffSelection'; // Новый компонент
// import RouteMap from './RouteMap';

import { getDistanceTariff } from '@/utils/tariffCalculator';





interface Tariff {
  id: string;
  name: string;
  price: number;
  time: string;
  icon: string;
}

interface Point {
  lat: number;
  lng: number;
}

interface City {
  id: string;
  name: string;
  coords: [number, number];
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





const cities: City[] = [
  { id: "52", name: "Красноярск", coords: [56.0153, 92.8932] },
  { id: "51", name: "Белгород", coords: [50.595, 36.5873] },
  { id: "50", name: "Пятигорск", coords: [44.0486, 43.0594] },
  { id: "49", name: "Архангельск", coords: [64.5393, 40.5187] },
  { id: "48", name: "Ставрополь", coords: [45.0445, 41.969] },
  { id: "47", name: "Рязань", coords: [54.6194, 39.7449] },
  { id: "45", name: "Подольск (Моск)", coords: [55.4242, 37.5547] },
  { id: "44", name: "Астрахань", coords: [46.3479, 48.0336] },
  { id: "43", name: "Киров (Киров, обл)", coords: [58.6036, 49.668] },
  { id: "42", name: "Ижевск", coords: [56.8527, 53.2115] },
  { id: "41", name: "Пенза", coords: [53.195, 45.0183] },
  { id: "40", name: "Ульяновск", coords: [54.3142, 48.4031] },
  { id: "39", name: "Липецк", coords: [52.6088, 39.5992] },
  { id: "38", name: "Томск", coords: [56.4846, 84.9476] },
  { id: "37", name: "Барнаул", coords: [53.3561, 83.7496] },
  { id: "36", name: "Балашиха (Моск. обл)", coords: [55.8094, 37.9581] },
  { id: "35", name: "Набережные Челны", coords: [55.7436, 52.3958] },
  { id: "34", name: "Новокузнецк (Кемер. обл)", coords: [53.7865, 87.1552] },
  { id: "33", name: "Вологда", coords: [59.2205, 39.8915] },
  { id: "32", name: "Брянск", coords: [53.2434, 34.3642] },
  { id: "31", name: "Магнитогорск", coords: [53.4117, 58.9844] },
  { id: "30", name: "Саратов", coords: [51.5924, 45.9608] },
  { id: "29", name: "Ярославль", coords: [57.6261, 39.8845] },
  { id: "28", name: "Керчь", coords: [45.3561, 36.4674] },
  { id: "27", name: "Тюмень", coords: [57.153, 65.5343] },
  { id: "26", name: "Сочи", coords: [43.5855, 39.7231] },
  { id: "25", name: "Иркутск", coords: [52.2896, 104.2806] },
  { id: "24", name: "Севастополь", coords: [44.6166, 33.5254] },
  { id: "23", name: "Краснодар", coords: [45.0355, 38.9753] },
  { id: "22", name: "Оренбург", coords: [51.7682, 55.097] },
  { id: "21", name: "Великий Новгород", coords: [58.5228, 31.2698] },
  { id: "20", name: "Москва", coords: [55.751244, 37.618423] },
  { id: "19", name: "Челябинск", coords: [55.1598, 61.4025] },
  { id: "18", name: "Нижний Новгород", coords: [56.3269, 44.0075] },
  { id: "17", name: "Новосибирск", coords: [55.0084, 82.9357] },
  { id: "16", name: "Пермь", coords: [58.0105, 56.2294] },
  { id: "15", name: "Волгоград", coords: [48.7071, 44.517] },
  { id: "14", name: "Хабаровск", coords: [48.4802, 135.0719] },
  { id: "13", name: "Екатеринбург", coords: [56.838, 60.5975] },
  { id: "12", name: "Тольятти", coords: [53.5078, 49.4204] },
  { id: "11", name: "Воронеж", coords: [51.6608, 39.2003] },
  { id: "10", name: "Уфа", coords: [54.7351, 55.9587] },
  { id: "9", name: "Кемерово", coords: [55.3547, 86.0884] },
  { id: "8", name: "Казань", coords: [55.7963, 49.1088] },
  { id: "7", name: "Владивосток", coords: [43.1155, 131.8855] },
  { id: "6", name: "Омск", coords: [54.9914, 73.3645] },
  { id: "5", name: "Ростов-на Дону", coords: [47.222, 39.7203] },
  { id: "4", name: "Санкт-Петербург", coords: [59.934280, 30.335098] }
];






export default function CustomMapWrapper() {
  const [selectedCity, setSelectedCity] = useState<City>(cities.find(c => c.name === "Санкт-Петербург") || cities[0]);
  
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

  const webApp = useTelegramWebApp();



  useEffect(() => {
    if (step === 'tarif' && startPoint && endPoint) {
      calculatePrices();
    }
  }, [step]);

  const calculatePrices = async () => {
    if (!startPoint || !endPoint) return;
    
    setIsCalculating(true);
    setRouteNodes([]); // Сбрасываем предыдущий маршрут
    
    const points: [number, number][] = [
      [startPoint.lng, startPoint.lat],
      [endPoint.lng, endPoint.lat]
    ];

    try {
      // Делаем ОДИН запрос для тарифа ID=1
      const response = await getDistanceTariff(selectedCity.id, 1, points);
      
      // Извлекаем данные из ответа
      const { min_price, pre_price, fix_price, execution_time, nodes } = response;
      
      // Сохраняем точки маршрута
      if (nodes && nodes.length > 0) {
        setRouteNodes(nodes);
      }
      
      // Формируем тарифы на основе полученных цен
      const tariffs = [
        {
          id: 'econom',
          name: 'ЭКОНОМ',
          icon: '🚕',
          price: parseInt(min_price) || 0,
          time: getEstimatedTime(response.distance),
          distance: response.distance || '0 км'
        },
        {
          id: 'comfort',
          name: 'КОМФОРТ',
          icon: '🚙',
          price: parseInt(pre_price) || 0,
          time: getEstimatedTime(response.distance),
          distance: response.distance || '0 км'
        },
        {
          id: 'comfort_plus',
          name: 'КОМФОРТ+',
          icon: '🚘',
          price: parseInt(fix_price) || 0,
          time: getEstimatedTime(response.distance),
          distance: response.distance || '0 км'
        }
      ];

      setCalculatedTariffs(tariffs);
      setShowTariff(true);
    } catch (error) {
      console.error('Failed to calculate tariffs:', error);
      setShowTariff(false)
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
      const city = cities.find(c => c.id === cityId);
      if (city) {
          setSelectedCity(city);
          // console.log('select new city', city.name, city.coords)
          // Если карта уже загружена, меняем центр
          if (mapRef.current) {
              mapRef.current.flyTo(city.coords, 15);
          }
      }
  };

  // Обработчик выбора точки
  const handleSetPoint = (point: Point, addr: string) => {
    
    if (step === 'start') {
      setStartPoint(point);
      setStartAddress(addr);
    } else if (step === 'end') {
      setEndPoint(point);
      setEndAddress(addr);
    } else if (step === 'tarif') {
      // После выбора точки прибытия показываем тарифы
      setShowTariff(true);
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
      mapRef.current.panTo([coords.lat, coords.lng], 15);
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


  const handleOrderTaxi = (tariffId: string, paymentMethod: "cash" | "card", specialRequests: string[], finalPrice: number) => {
    console.log('Заказ такси с тарифом:', tariffId, paymentMethod, specialRequests);
    
    const orderData = JSON.stringify({
      startPoint: startPoint ? [startPoint.lng, startPoint.lat] : null,
      endPoint: endPoint ? [endPoint.lng, endPoint.lat] : null,
      startAddress,
      endAddress,
      options: specialRequests,
      tariffId,
      paymentMethod,
      finalPrice
    });

    
    // Если в Telegram - отправляем через WebApp API
    if (webApp || window.Telegram) {
      try {
        webApp.sendData(JSON.stringify(orderData));
        webApp.showAlert('Заказ успешно оформлен!', () => {
          webApp.close();
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


    
    // После заказа можно сбросить состояние
    alert('Заказ оформлен!');
    setShowTariff(false);
    resetPoints();
  };



  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';





  return (
  <>
    <div className={styles.cityPanel}>
      <select 
        value={selectedCity.id} 
        onChange={handleCityChange}
        className={styles.citySelect}
      >
        {cities.map(city => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </div>

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
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelectAddress={handleAddressSelect}
        addressType={currentAddressType}
        currentAddress={address}
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
          center={selectedCity.coords}
          startPoint={startPoint}
          endPoint={endPoint}
          step={step}
          onSetPoint={handleSetPoint}
          onMapMove={handleMapMove}
          onMapLoad={handleMapLoad}
          routeNodes={routeNodes} // Передаем точки маршрута
        />
      </MapContainer>
    
  </div>

    
  </>
  );

}