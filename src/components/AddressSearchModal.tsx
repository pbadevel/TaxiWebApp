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
        url.searchParams.append("format", "jsonv2");
        url.searchParams.append("countrycodes", "ru");
        url.searchParams.append("viewbox", bounds);
        url.searchParams.append("bounded", "1");
        url.searchParams.append("q", query); // Используем оригинальный запрос
        url.searchParams.append("addressdetails", "1");
        url.searchParams.append("limit", "20");
        url.searchParams.append("dedupe", "1"); // Убираем дубликаты
        url.searchParams.append("polygon_threshold", "0.001"); // Точность геометрии


        const response = await fetch(url, {
          headers: {
            "Accept-Language": "ru"
          }
        });
        
        
        if (response.ok) {
          
          let results = await response.json();
          // Фильтруем только релевантные типы объектов
          results = results.filter((item: any) => 
            ['highway', 'building', 'amenity', 'place'].includes(item.category)
          );
          
          // Сортируем по важности (числовая сортировка!)
          results.sort((a: any, b: any) => b.importance - a.importance);
          console.log(results);
          setResults(results);
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