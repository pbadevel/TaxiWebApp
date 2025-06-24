'use client';
import { useState, useEffect, useRef } from 'react';

import styles from '../styles/addressSearch.module.css';

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimResult {
  display_name: string;
  type: string;
  class: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
  };
}


interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (coords: { lat: number; lng: number }) => void;
  addressType: 'start' | 'end' | "tarif";
  currentAddress: string,
  currentCityBounds?: [[number, number], [number, number]]
}

export default function AddressSearchModal({ 
  isOpen, 
  onClose, 
  onSelectAddress,
  addressType,
  currentAddress,
  currentCityBounds
}: AddressSearchModalProps) {
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(currentAddress);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Фокус на инпуте при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Поиск адресов с задержкой
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const TrueCityBounds = currentCityBounds || [[29.80, 59.70], [30.85, 60.15]];
        // Правильный порядок для viewbox:
        const bounds = `${TrueCityBounds[0][1]},${TrueCityBounds[1][0]},${TrueCityBounds[1][1]},${TrueCityBounds[0][0]}`;
        
        
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.append("format", "json");
        url.searchParams.append("countrycodes", "ru");
        url.searchParams.append("viewbox", bounds);
        url.searchParams.append("bounded", "1");
        url.searchParams.append("q", query);
        url.searchParams.append("addressdetails", "1");
        url.searchParams.append("limit", "20"); // Увеличиваем лимит для последующей фильтрации
        url.searchParams.append("featuretype", "street"); // Фокусируемся на улицах
        url.searchParams.append("dedupe", "0");

        const response = await fetch(url, {
          headers: {
            "Accept-Language": "ru"
          }
        });

        

        
        
        
        if (response.ok) {
          
          const results = await response.json();
        
            // Фильтрация для точного соответствия началу слова
          const filteredResults = results.filter((item: NominatimResult) => {
            // Основные типы адресных объектов
            const isAddressType = [
              'street', 'road', 'residential', 'pedestrian',
              'footway', 'trunk', 'primary', 'secondary'
            ].includes(item.type);
            
            // Основные классы адресных объектов
            const isAddressClass = [
              'highway', 'place', 'building'
            ].includes(item.class);
            
            // Если не адресный объект - пропускаем
            if (!(isAddressType || isAddressClass)) return false;
            
            // Получаем основное название объекта
            const mainName = (
              item.address?.road ||        // Для улиц
              item.address?.suburb ||     // Для районов
              item.display_name           // Фолбек
            ).toLowerCase();
            
            // Проверяем совпадение с началом слова
            const queryLower = query.toLowerCase();
            const words = mainName.split(/\s+/);
            
            // Ищем слово, начинающееся с запроса
            return words.some(word => word.startsWith(queryLower));
          }).slice(0, 5); // Берем первые 5 результатов
        
        setResults(filteredResults);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Ошибка поиска адреса:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(searchTimeout);
  }, [query]);
  
  // Обработчик выбора адреса
  const handleSelect = (result: AddressResult) => {
    onSelectAddress({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
     
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
       <button className={styles.backButton} onClick={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
       </button>
        <h2 className={styles.modalTitle}>
          {addressType === 'start' ? 'Выберите место посадки' : 'Выберите место прибытия'}
        </h2>
        
        <div className={styles.searchContainer}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите адрес..."
            className={styles.searchInput}
          />
          
          {isLoading && (
            <div className={styles.loader}>
              <div className={styles.spinner}></div>
            </div>
          )}
        </div>
        
        <div className={styles.resultsContainer}>
          {results.length > 0 ? (
            results.map((result, index) => (
              <div 
                key={index} 
                className={styles.resultItem}
                onClick={() => handleSelect(result)}
              >
                {result.display_name.split(',').slice(0, 4).join(',')}
              </div>
            ))
          ) : query && !isLoading ? (
            <div className={styles.noResults}>Адресов не найдено</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}