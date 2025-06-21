import {useState, useEffect } from "react";


// Утилита для инициализации Telegram WebApp
export const initTelegramWebApp = () => {
  // Проверяем, что находимся в браузере
  if (typeof window === 'undefined') return null;
  
  // Проверяем наличие Telegram WebApp API
  if (window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    
    // Расширяем приложение на весь экран
    webApp.expand();
    
    // Устанавливаем цвет фона
    webApp.setBackgroundColor('#ffffff');
    
    return webApp;
  }
  
  return null;
};

// Хук для использования Telegram WebApp
export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<any>(null);

  useEffect(() => {
    const tgWebApp = initTelegramWebApp();
    setWebApp(tgWebApp);
  }, []);

  return webApp;
};