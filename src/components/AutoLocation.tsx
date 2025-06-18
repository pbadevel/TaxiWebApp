'use client';
import { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import styles from '../styles/page.module.css';

interface LocationButtonProps {
  onLocationFound: (position: [number, number]) => void;
}

const GeoLocationButton = ({ onLocationFound }: LocationButtonProps) => {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);

  // Иконка для кнопки
  const locationIcon = L.divIcon({
    className: styles.locationButton,
    html: `
      <div class="${styles.locationButtonInner}">
        ${isLoading 
          ? `<div class="${styles.locationSpinner}"></div>` 
          : `<svg viewBox="0 0 24 24" fill="none">
               <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V1H11V3.06C6.83 3.52 3.52 6.83 3.06 11H1V13H3.06C3.52 17.17 6.83 20.48 11 20.94V23H13V20.94C17.17 20.48 20.48 17.17 20.94 13H23V11H20.94Z" fill="currentColor"/>
             </svg>`
        }
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const locateUser = () => {
    if (!navigator.geolocation) {
      setError("Геолокация не поддерживается вашим браузером");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPosition: [number, number] = [latitude, longitude];
        
        setPosition(newPosition);
        map.setView(newPosition, 15);
        onLocationFound(newPosition);
        setIsLoading(false);
      },
      (err) => {
        console.error("Ошибка геолокации:",   );
        setError("Не удалось определить местоположение");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Автоматически добавляем кнопку на карту
  useEffect(() => {
    const buttonControl = L.control.zoom({ position: 'bottomright' });
    
    buttonControl.onAdd = () => {
      const container = L.DomUtil.create('div', styles.locationControl);
      L.DomEvent.disableClickPropagation(container);
      
      const button = L.DomUtil.create('button', styles.locationButton);
      button.innerHTML = `
        <div class="${styles.locationButtonInner}">
          ${isLoading 
            ? `<div class="${styles.locationSpinner}"></div>` 
            : `<svg viewBox="0 0 24 24" fill="none">
                 <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V1H11V3.06C6.83 3.52 3.52 6.83 3.06 11H1V13H3.06C3.52 17.17 6.83 20.48 11 20.94V23H13V20.94C17.17 20.48 20.48 17.17 20.94 13H23V11H20.94Z" fill="currentColor"/>
               </svg>`
          }
        </div>
      `;
      
      L.DomEvent.on(button, 'click', locateUser);
      container.appendChild(button);
      return container;
    };
    
    buttonControl.addTo(map);
    
    return () => {
      map.removeControl(buttonControl);
    };
  }, [map, isLoading]);

  return null;
};

export default GeoLocationButton;