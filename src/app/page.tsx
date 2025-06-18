import CustomMapWrapper from '@/components/MapWrapper';
import styles from '../styles/page.module.css';



// Динамическая загрузка карты

export default function Home() {
  

  
  return (
    <main className={styles.container}>
      {/* Контейнер карты с фиксированным маркером */}
      <div className={styles.mapContainerWrapper}>
         <CustomMapWrapper/>
      </div>
    </main>
  );
}