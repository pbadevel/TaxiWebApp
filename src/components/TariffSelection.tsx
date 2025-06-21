// components/TariffSelection.tsx
'use client';
import { useState, useMemo } from 'react';
import styles from '../styles/tarif.module.css';

interface Tariff {
  id: number;
  name: string;
  price: number;
  time: string;
  icon: string;
  distance?: string;
}

interface SpecialOption {
  id: string;
  name: string;
  price: number;
}

interface TariffSelectionProps {
  startAddress: string;
  endAddress: string;
  onBack: () => void;
  onOrder: (tariffId: number, 
    paymentMethod: "cash" | "card", 
    specialRequests: string[], 
    finalPrice: number
  ) => void;
  tariffs: Tariff[];
}

export default function TariffSelection({ 
  startAddress, 
  endAddress, 
  onBack,
  onOrder,
  tariffs
}: TariffSelectionProps) {
  const [selectedTariff, setSelectedTariff] = useState<number>(tariffs[0]?.id);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [specialRequests, setSpecialRequests] = useState<string[]>([]);

  // Список дополнительных опций
  const specialOptions: SpecialOption[] = [
    { id: 'child_seat', name: 'Детское кресло', price: 50 },
    { id: 'pet', name: 'Перевозка животного', price: 100 },
    { id: 'luggage', name: 'Большой багаж', price: 70 }
  ];

  // Находим выбранный тариф
  const selectedTariffData = useMemo(() => 
    tariffs.find(t => t.id === selectedTariff) || tariffs[0], 
    [selectedTariff, tariffs]
  );

  // Рассчитываем итоговую цену
  const finalPrice = useMemo(() => {
    if (!selectedTariffData) return 0;
    
    // Базовая цена тарифа
    let total = selectedTariffData.price;
    
    // Добавляем стоимость дополнительных опций
    specialRequests.forEach(requestId => {
      const option = specialOptions.find(opt => opt.id === requestId);
      if (option) {
        total += option.price;
      }
    });
    
    return total;
  }, [selectedTariffData, specialRequests, specialOptions]);

  // Переключение дополнительных опций
  const toggleSpecialRequest = (id: string) => {
    if (specialRequests.includes(id)) {
      setSpecialRequests(specialRequests.filter(item => item !== id));
    } else {
      setSpecialRequests([...specialRequests, id]);
    }
  };

  const handleOrder = () => {
    onOrder(selectedTariff, paymentMethod, specialRequests, finalPrice);
  };

  

  return (
    <div className={styles.tariffContainer}>
      {/* Кнопка назад */}
      <button className={styles.backButton} onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Адреса поездки */}
      <div className={styles.routeAddresses}>
        <div className={styles.addressPoint}>
          <div className={styles.addressMarker}>A</div>
          <div className={styles.addressText}>
            {startAddress.length > 30 
              ? `${startAddress.substring(0, 30)}...` 
              : startAddress}
          </div>
        </div>
        <div className={styles.addressPoint}>
          <div className={styles.addressMarker}>Б</div>
          <div className={styles.addressText}>
            {endAddress.length > 30
              ? `${endAddress.substring(0, 30)}...` 
              : endAddress}
          </div>
        </div>
      </div>

      {/* Выбор тарифа */}
      <div className={styles.tariffGrid}>
        {tariffs.map(tariff => (
          <div 
            key={tariff.id}
            className={`${styles.tariffCard} ${selectedTariff === tariff.id ? styles.selectedTariff : ''}`}
            onClick={() => setSelectedTariff(tariff.id)}
          >
            <div className={styles.tariffIcon}>{tariff.icon}</div>
            <div className={styles.tariffName}>{tariff.name}</div>
            <div className={styles.tariffPrice}>{tariff.price}₽</div>
            <div className={styles.tariffTime}>{tariff.time}</div>
            {tariff.distance && (
              <div className={styles.tariffDistance}>{tariff.distance}</div>
            )}
          </div>
        ))}
      </div>

      {/* Способ оплаты */}
      <div className={styles.paymentContainer}>
        <div className={styles.sectionTitle}>Способ оплаты</div>
        <div className={styles.paymentMethods}>
          <button 
            className={`${styles.paymentButton} ${paymentMethod === 'cash' ? styles.activePayment : ''}`}
            onClick={() => setPaymentMethod('cash')}
          >
            Наличные
          </button>
          <button 
            className={`${styles.paymentButton} ${paymentMethod === 'card' ? styles.activePayment : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            Картой
          </button>
        </div>
      </div>

      {/* Пожелания */}
      <div className={styles.requestsContainer}>
        <div className={styles.sectionTitle}>Пожелания</div>
        <div className={styles.requestsGrid}>
          {specialOptions.map(option => (
            <div 
              key={option.id}
              className={`${styles.requestOption} ${specialRequests.includes(option.id) ? styles.selectedRequest : ''}`}
              onClick={() => toggleSpecialRequest(option.id)}
            >
              <div>{option.name}</div>
              <div>+{option.price}₽</div>
            </div>
          ))}
        </div>
      </div>

      {/* Блок с итоговой ценой */}
      <div className={styles.finalPriceContainer}>
        <div className={styles.finalPriceLabel}>Итоговая стоимость:</div>
        <div className={styles.finalPriceValue}>{finalPrice}₽</div>
      </div>

      {/* Кнопка заказа */}
      <button 
        className={styles.orderButton}
        onClick={handleOrder}
      >
        Заказать такси за {finalPrice}₽
      </button>
    </div>
  );
}