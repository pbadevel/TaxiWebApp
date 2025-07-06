

interface TariffOption {
  tariffId: number;
  name: string;
}




interface City {
  id: string;
  name: string;
  coords: [number, number];
  operatorUnitId?: string; // Новое поле для ID из API
  tariffs?: TariffOption[];
}

interface ApiTariff {
  id: string;
  title: string;
  // Добавьте другие поля из ответа API при необходимости
}

interface ApiUnit {
  id: string;
  title: string;
  tarifs: ApiTariff[];
}



export function updateCitiesWithTariffs(
  initialCities: City[],
  apiData: { units?: ApiUnit[] }
): City[] {
  if (!apiData?.units) return initialCities;
  console.log('ok uints',)

  const apiCitiesMap = new Map<string, ApiUnit>();
  apiData.units.forEach((unit: ApiUnit) => {
    apiCitiesMap.set(unit.id, unit);
  });

  return initialCities.map(city => {
    // console.log(city.operatorUnitId)
    // if (!city.operatorUnitId) return city;
    
    const apiCity = apiCitiesMap.get(city.id);
    console.log(apiCity)
    if (!apiCity?.tarifs) return city;

    console.log('ok tariffs')

    const newTariffs = apiCity.tarifs
      .filter((tarif: ApiTariff) => tarif?.id && tarif?.title)
      .map((tarif: ApiTariff) => ({
        tariffId: parseInt(tarif.id),
        name: normalizeTariffName(tarif.title)
      }));

    return { ...city, tariffs: newTariffs };
  });
}

function normalizeTariffName(name: string): string {
  const normalized = name.toLowerCase();

  const mapping: Record<string, string> = {
    'эконом': 'Эконом',
    'комфорт': 'Комфорт',
    'комфорт+': 'Комфорт +', // Для случаев с пробелом
    'минивэн': 'Минивэн',
    'оптимал': 'Оптимал'
  };
  
  return mapping[normalized] || 
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}