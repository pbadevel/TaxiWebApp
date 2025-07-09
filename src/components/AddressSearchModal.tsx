'use client';
import { useState, useEffect, useRef } from 'react';
import styles from '../styles/addressSearch.module.css';

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (coords: { lat: number; lng: number }) => void;
  addressType: 'start' | 'end' | "tarif";
  currentAddress: string,
  currentCityBounds?: [[number, number], [number, number]],
  unitId: string
}

function parseAddressData(data: string): AddressResult[] {
  return data
    .split('\n')
    .map(line => {
      const parts = line.split('|');
      if (parts.length < 5) return null;
      
      return {
        display_name: parts[0],
        lon: parts[3],
        lat: parts[4]
      };
    })
    .filter(Boolean) as AddressResult[];
}

export default function AddressSearchModal({ 
  isOpen, 
  onClose, 
  onSelectAddress,
  addressType,
  currentAddress,
  currentCityBounds,
  unitId
}: AddressSearchModalProps) {
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(currentAddress);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AddressResult | null>(null);

  // Сброс состояния при открытии
  useEffect(() => {
    if (isOpen) {
      setQuery(currentAddress);
      setSelectedResult(null);
    }
  }, [isOpen, currentAddress]);

  // Фокус на инпуте при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Поиск адресов с задержкой
  useEffect(() => {
    if (!isOpen) return;
    
    const searchAddress = async () => {
      setIsLoading(true);
      try {
        const baseAddress = process.env.NEXT_PUBLIC_BASE_PATH;

        if (!query.trim()) {
          setResults([]);
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${baseAddress}/api/search-address`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            unitId,
            query
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const parsedData = parseAddressData(data['data']);
        setResults(parsedData);
      } catch (error) {
        console.error('Ошибка поиска адреса:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const searchTimeout = setTimeout(searchAddress, 500);
    return () => clearTimeout(searchTimeout);
  }, [query, isOpen]);

  // Обработчик выбора адреса из списка
  const handleSelectResult = (result: AddressResult) => {
    setQuery(result.display_name);
    setSelectedResult(result);
  };

  // Подтвердить адрес
  const handleConfirmAddress = () => {
    if (selectedResult) {
      onSelectAddress({
        lat: parseFloat(selectedResult.lat),
        lng: parseFloat(selectedResult.lon)
      });
    } else if (results.length > 0) {
      // Если не выбрали конкретно, но есть результаты - берем первый
      const firstResult = results[0];
      onSelectAddress({
        lat: parseFloat(firstResult.lat),
        lng: parseFloat(firstResult.lon)
      });
    }
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
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedResult(null);
            }}
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
                className={`${styles.resultItem} ${selectedResult === result ? styles.selectedItem : ''}`}
                onClick={() => handleSelectResult(result)}
              >
                {result.display_name}
              </div>
            ))
          ) : query && !isLoading ? (
            <div className={styles.noResults}>Адресов не найдено</div>
          ) : null}
        </div>
        
        {/* Кнопка "Далее" для подтверждения адреса */}
        <div className={styles.nextButtonContainer}>
          <button 
            className={styles.nextButton}
            onClick={handleConfirmAddress}
            disabled={results.length === 0 && !selectedResult}
          >
            Далее
          </button>
        </div>
      </div>
    </div>
  );
}