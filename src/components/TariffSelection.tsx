// components/TariffSelection.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import styles from '../styles/tarif.module.css';

interface Tariff {
  id: number; // ID тарифа - число
  name: string;
  price: number;
  time: string;
  icon: string;
  distance?: string;
}

interface SpecialOption {
  id: string; // ID опции - строка
  name: string;
  price: number | string; // Цена может быть числом или строкой
}

interface TariffSelectionProps {
  startAddress: string;
  endAddress: string;
  onBack: () => void;
  onOrder: (
    tariffId: number, // ID тарифа - число
    paymentMethod: "cash" | "card", 
    specialRequests: string[], // ID опций - строки
    finalPrice: string
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
  const [selectedTariff, setSelectedTariff] = useState<number>(tariffs[0]?.id || 0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [specialRequests, setSpecialRequests] = useState<string[]>([]);

    // Список дополнительных опций
  const specialOptions = [
    { id: '9', name: 'Надбавка водителю', price: 20 },
    { id: '10', name: 'Надбавка водителю', price: 50 },
    { id: '11', name: 'Надбавка водителю', price: 80 },
    { id: '7', name: 'Багаж в салон автомобиля', price: 50 },
    { id: '2', name: 'Бустер (сидение для детей)', price: 0 },
    { id: '3', name: 'Домашнее животное на руках', price: 50 },
    { id: '6', name: 'Животное в переноске', price: 30 },
    { id: '1', name: 'КУРЬЕРСКАЯ УСЛУГА', price: "20%" },
    { id: '4', name: 'Курящий салон (эл. сигареты)', price: 30 },
    { id: '12', name: 'МИКРОАВТОБУС (5 пассажиров + БАГАЖ)', price: "40%" },
    { id: '21', name: 'Надбавка дл. расст. + плохие дороги', price: 3500 },
    { id: '17', name: 'Надбавка длинные расстояния', price: 300 },
    { id: '15', name: 'Надбавка за длинные расстояния', price: 1500 },
    { id: '25', name: 'Надбавка за доп. расст. + плохие дороги', price: 2500 },
    { id: '18', name: 'Надбавка Межгород', price: "50%" },
    { id: '19', name: 'Надбавка Межгород длин. расстояния', price: 600 },
    { id: '23', name: 'Надбавка Межгород +', price: 400 },
    { id: '22', name: 'Надбавка расст. + плохие дороги', price: 200 },
    { id: '20', name: 'Надбавка - длинные расстояния', price: 800 },
    { id: '13', name: 'Перевозка груза (ЛАРГУС)', price: 350 },
    { id: '5', name: 'Помощь с передвижением тяжелого/габаритного багажа', price: 100 }
  ];

  // Заранее выбираем тариф
  useEffect(() => {
    if (tariffs.length > 0) {
      setSelectedTariff(tariffs[0].id);
    }
  }, [tariffs]);

  // Находим выбранный тариф
  const selectedTariffData = useMemo(() => 
    tariffs.find(t => t.id === selectedTariff) || null, 
    [selectedTariff, tariffs]
  );

  // Рассчитываем итоговую цену
  const finalPrice = useMemo(() => {
    if (!selectedTariffData) return '0';
    
    let total = selectedTariffData.price;
    
    specialRequests.forEach(requestId => {
      const option = specialOptions.find(opt => opt.id === requestId);
      if (option) {
        // Обрабатываем разные форматы цен
        if (typeof option.price === 'number') {
          total += option.price;
        } 
        // Обработка процентных надбавок
        else if (typeof option.price === 'string' && option.price.includes('%')) {
          const percentage = parseFloat(option.price);
          if (!isNaN(percentage)) {
            total += (selectedTariffData.price * percentage) / 100;
          }
        }
        // Пытаемся преобразовать строку в число
        else if (typeof option.price === 'string') {
          const numericPrice = parseFloat(option.price);
          if (!isNaN(numericPrice)) {
            total += numericPrice;
          }
        }
      }
    });
    
    return total.toFixed(2);
  }, [selectedTariffData, specialRequests]);

  // Переключение дополнительных опций
  const toggleSpecialRequest = (id: string) => {
    if (specialRequests.includes(id)) {
      setSpecialRequests(specialRequests.filter(item => item !== id));
    } else {
      setSpecialRequests([...specialRequests, id]);
    }
  };

  const handleOrder = () => {
    if (selectedTariffData) {
      onOrder(selectedTariff, paymentMethod, specialRequests, finalPrice);
    }
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
              <div>+{typeof option.price === 'number' ? `${option.price}₽` : option.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Блок с итоговой ценой */}
      <div className={styles.finalPriceContainer}>
        <div className={styles.finalPriceLabel}>Итоговая стоимость:</div>
        <div className={styles.finalPriceValue}>
          {finalPrice as unknown as number > 0 ? `${finalPrice}₽` : 'Выберите тариф...'}
        </div>
      </div>

      {/* Кнопка заказа */}
      <button 
        className={`${styles.orderButton} ${finalPrice as unknown as number > 0 ? '' : styles.ButtonInactive}`}
        onClick={handleOrder}
        disabled={finalPrice as unknown as number <= 0}
      >
        {finalPrice as unknown as number > 0 ? `Заказать такси за ${finalPrice}₽` : 'Рассчитывается...'}
      </button>
    </div>
  );
}