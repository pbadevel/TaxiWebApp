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
}

interface TariffSelectionProps {
  startAddress: string;
  endAddress: string;
  onBack: () => void;
  onOrder: (tariffId: string) => void;
}

export default function TariffSelection({ 
  startAddress, 
  endAddress, 
  onBack,
  onOrder
}: TariffSelectionProps) {
  const [selectedTariff, setSelectedTariff] = useState<string>('econom');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [specialRequests, setSpecialRequests] = useState<string[]>([]);

  // Заглушка тарифов (в реальном приложении будем получать через API)
  const tariffs: Tariff[] = [
    { id: 'econom', name: 'ЭКОНОМ', price: 235, time: '5-7 мин', icon: '🚕' },
    { id: 'comfort', name: 'КОМФОРТ', price: 335, time: '3-5 мин', icon: '🚙' },
    { id: 'comfort_plus', name: 'КОМФОРТ+', price: 435, time: '2-4 мин', icon: '🚘' }
  ];

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
    // В реальном приложении будем отправлять данные на сервер
    let total_price = tariffs.find(t => t.id === selectedTariff)?.price || 0

    specialOptions.map((j) => {
      total_price += j.price;  
    } );  
    
    const orderData = {
      startAddress,
      endAddress,
      tariff: selectedTariff,
      paymentMethod,
      specialRequests,
      totalPrice:  total_price
    };
    
    console.log('Order data:', orderData);
    onOrder(selectedTariff);
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