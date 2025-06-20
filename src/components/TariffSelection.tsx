// components/TariffSelection.tsx
'use client';
import { useState } from 'react';
import styles from '../styles/tarif.module.css';

interface Tariff {
  id: string;
  name: string;
  price: number;
  time: string;
  icon: string;
  distance?: string; // Добавляем опциональное поле расстояния

}


interface TariffSelectionProps {
  startAddress: string;
  endAddress: string;
  onBack: () => void;
  onOrder: (tariffId: string, paymentMethod: "cash" | "card", specialRequests: string[]) => void;
  tariffs: Tariff[]; // Принимаем рассчитанные тарифы
}

export default function TariffSelection({ 
 startAddress, 
  endAddress, 
  onBack,
  onOrder,
  tariffs // Используем переданные тарифы вместо заглушек
}: TariffSelectionProps) {
  const [selectedTariff, setSelectedTariff] = useState<string>('econom');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [specialRequests, setSpecialRequests] = useState<string[]>([]);
  

  const specialOptions = [
    { id: 'child_seat', name: 'Детское кресло', price: 50 },
    { id: 'pet', name: 'Перевозка животного', price: 100 },
    { id: 'luggage', name: 'Большой багаж', price: 70 }
  ];

  const toggleSpecialRequest = (id: string) => {
    if (specialRequests.includes(id)) {
      setSpecialRequests(specialRequests.filter(item => item !== id));
    } else {
      setSpecialRequests([...specialRequests, id]);
    }
  };

  const handleOrder = () => {
    // console.log("handle order!", selectedTariff, paymentMethod, specialRequests)
    onOrder(selectedTariff, paymentMethod, specialRequests);
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
            ? startAddress.substring(0, 30) + '...' 
            : startAddress}
        </div>
      </div>
      <div className={styles.addressPoint}>
        <div className={styles.addressMarker}>Б</div>
        <div className={styles.addressText}>
          {endAddress.length > 30
            ? endAddress.substring(0, 30) + '...' 
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
              {option.name} +{option.price}₽
            </div>
          ))}
        </div>
      </div>

      {/* Кнопка заказа */}
      <button 
        className={styles.orderButton}
        onClick={handleOrder}
      >
        Заказать такси
      </button>
    </div>
  );
}