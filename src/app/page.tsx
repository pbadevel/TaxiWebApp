'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

import { MapContainer } from 'react-leaflet';

import dynamic from 'next/dynamic';
import styles from './page.module.css';



interface Point {
  lat: number;
  lng: number;
}

interface City {
  id: string;
  name: string;
  coords: [number, number];
}

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

// Динамическая загрузка карты
const RouteMap = dynamic(() => import('../components/RouteMap'), {
  ssr: false,
  loading: () => <p>Загрузка карты...</p>
});

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City>(cities.find(c => c.name === "Санкт-Петербург") || cities[0]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [step, setStep] = useState<'start' | 'end'>('start');
  const [address, setAddress] = useState<string>('Выберите место');
  const mapRef = useRef<any>(null);

  // Обработчик смены города
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setSelectedCity(city);
      // Если карта уже загружена, меняем центр
      if (mapRef.current) {
        mapRef.current.setView(city.coords);
      }
    }
  };

  // Обработчик выбора точки
  const handleSetPoint = (point: Point, addr: string) => {
    if (step === 'start') {
      setStartPoint(point);
      setAddress(addr);
      setStep('end');
    } else {
      setEndPoint(point);
    }
  };

  // Обработчик клика по адресу
  const handleAddressClick = () => {
    if (step === 'end' && startPoint) {
      setStartPoint(null);
      setEndPoint(null);
      setStep('start');
      setAddress('Выберите место');
    }
  };

  // Сброс точек
  const resetPoints = () => {
    setStartPoint(null);
    setEndPoint(null);
    setStep('start');
    setAddress('Выберите место');
  };

  // Передача ссылки на карту
  const handleMapLoad = (mapInstance: any) => {
    mapRef.current = mapInstance;
  };

  return (
    <main className={styles.container}>
      {/* Панель выбора города */}
      
      <div className={styles.controlPanel}>
        <div className={styles.buttonGroup}>
          <button 
            className={`${styles.button} ${step === 'start' ? styles.activeButton : ''}`}
            onClick={() => setStep('start')}
          >
            Указать отправление
          </button>
          
          <button 
            className={`${styles.button} ${step === 'end' ? styles.activeButton : ''}`}
            onClick={() => setStep('end')}
            disabled={!startPoint}
          >
            Указать прибытие
          </button>
          
          <button 
            className={`${styles.button} ${styles.resetButton}`}
            onClick={resetPoints}
          >
            Сбросить
          </button>
        </div>
        
        <div className={styles.coordinates}>
          <p className={startPoint ? styles.activeText : styles.inactiveText}>
            <strong>Отправление:</strong> 
            {startPoint ? ` ${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}` : ' не указано'}
          </p>
          <p className={endPoint ? styles.activeText : styles.inactiveText}>
            <strong>Прибытие:</strong> 
            {endPoint ? ` ${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}` : ' не указано'}
          </p>
        </div>
      </div>
      
      {/* Контейнер карты с фиксированным маркером */}
      <div className={styles.mapContainerWrapper}>
         <MapContainer center={selectedCity.coords} zoom={13} style={{ height: '100%', width: '100%' }}>
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

          <RouteMap 
            center={selectedCity.coords}
            startPoint={startPoint}
            endPoint={endPoint}
            step={step}
            onSetPoint={handleSetPoint}
            onMapLoad={handleMapLoad}
          />
         </MapContainer>
        
        {/* Фиксированный маркер в центре */}
        <div className={styles.centerMarker}>
          
          
          <div 
            className={`${styles.markerLabel} ${step === 'end' ? styles.clickable : ''}`}
            onClick={handleAddressClick}
          >
            <div className={styles.markerTitle}>
              {step === 'start' ? 'Посадка' : 'Прибытие'}
            </div>
            <div className={styles.markerAddress}>{address}</div>
          </div>
          <Image 
            src={step === 'start' ? '/marker-green.png':'/marker-red.png'}
            width={30}
            height={50}
            alt='marker'
          />
        </div>
      </div>
    </main>
  );
}