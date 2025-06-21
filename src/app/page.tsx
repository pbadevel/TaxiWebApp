import CustomMapWrapper from '@/components/MapWrapper';
import styles from '../styles/page.module.css';
import { useState, useRef, useEffect, useCallback } from 'react';



// Динамическая загрузка карты

export default function Home() {

  
  useEffect(() => {
    initializeTelegram();
  }, []);
  
  const initializeTelegram = useCallback(async () => {
    try {
      const WebApp = window.Telegram?.WebApp

      if (!WebApp) throw new Error('Telegram WebApp not available');
      
      await WebApp.ready();
      WebApp.expand();

    
    } catch (error) {
      console.error('Initialization error:', error);
      // setLoading(false);
    }
    return null;
  }, []);

  
  return (
    <main className={styles.container}>
      {/* Контейнер карты с фиксированным маркером */}
      <div className={styles.mapContainerWrapper}>
         <CustomMapWrapper/>
      </div>
    </main>
  );
}