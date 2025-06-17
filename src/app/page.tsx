import CustomMapWrapper from '@/components/MapWrapper';
import styles from '../styles/page.module.css';



// Динамическая загрузка карты

export default function Home() {
  

  
  return (
    <main className={styles.container}>
      {/* Панель выбора города */}
      
      {/* <div className={styles.controlPanel}>
        <div className={styles.buttonGroup}>
          <button 
            className={`${styles.button} ${step === 'start' ? styles.activeButton : ''}`}
            onClick={() => setStep('start')}
          >
            Указать отправление
          </button>
          
          <button 
            className={`${styles.button} ${step === 'end' ? styles.activeButton : ''}`}
            onClick={() => setStep('end')}
            disabled={!startPoint}
          >
            Указать прибытие
          </button>
          
          <button 
            className={`${styles.button} ${styles.resetButton}`}
            onClick={resetPoints}
          >
            Сбросить
          </button>
        </div>
        
        <div className={styles.coordinates}>
          <p className={startPoint ? styles.activeText : styles.inactiveText}>
            <strong>Отправление:</strong> 
            {startPoint ? ` ${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}` : ' не указано'}
          </p>
          <p className={endPoint ? styles.activeText : styles.inactiveText}>
            <strong>Прибытие:</strong> 
            {endPoint ? ` ${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}` : ' не указано'}
          </p>
        </div>
      </div> */}
      
      {/* Контейнер карты с фиксированным маркером */}
      <div className={styles.mapContainerWrapper}>
         <CustomMapWrapper/>
      </div>
    </main>
  );
}