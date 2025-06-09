// app/page.tsx
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

interface Point {
  lat: number;
  lng: number;
}

// Динамическая загрузка карты
const RouteMap = dynamic(() => import('../components/RouteMap'), {
  ssr: false,
  loading: () => <p>Загрузка карты...</p>
});

export default function Home() {
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [activePoint, setActivePoint] = useState<'start' | 'end'>('start');

  const handleSetPoint = (point: Point) => {
    if (activePoint === 'start') {
      setStartPoint(point);
      setActivePoint('end');
    } else {
      setEndPoint(point);
      setActivePoint('start');
    }
  };

  const resetPoints = () => {
    setStartPoint(null);
    setEndPoint(null);
    setActivePoint('start');
  };

  // Классы для кнопок
  const getButtonClass = (type: 'start' | 'end' | 'reset') => {
    const base = styles.button;
    
    if (type === 'reset') return `${base} ${styles.resetButton}`;
    
    return type === activePoint 
      ? `${base} ${styles.activeButton} ${type === 'start' ? styles.startActive : styles.endActive}`
      : base;
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Планировщик маршрута</h1>
      
      <div className={styles.controlPanel}>
        <div className={styles.buttonGroup}>
          <button 
            className={getButtonClass('start')}
            onClick={() => setActivePoint('start')}
          >
            Указать отправление
          </button>
          
          <button 
            className={getButtonClass('end')}
            onClick={() => setActivePoint('end')}
          >
            Указать прибытие
          </button>
          
          <button 
            className={getButtonClass('reset')}
            onClick={resetPoints}
          >
            Сбросить
          </button>
        </div>
        
        <div className={styles.coordinates}>
          <p className={startPoint ? styles.activeText : styles.inactiveText}>
            <strong>Отправление:</strong> 
            {startPoint 
              ? ` ${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}` 
              : ' не указано'}
          </p>
          <p className={endPoint ? styles.activeText : styles.inactiveText}>
            <strong>Прибытие:</strong> 
            {endPoint 
              ? ` ${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}` 
              : ' не указано'}
          </p>
        </div>
      </div>
      
      <RouteMap 
        startPoint={startPoint}
        endPoint={endPoint}
        setStartPoint={handleSetPoint}
        setEndPoint={handleSetPoint}
      />
    </main>
  );
}