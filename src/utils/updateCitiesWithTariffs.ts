

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


const additionalCityCoordinates: Record<string, [number, number]> = {
  "Геленджик": [44.560, 38.075],
  "Евпатория": [45.191, 33.368],
  "Йошкар-Ола": [56.638, 47.891],
  "Сыктывкар": [61.676, 50.809],
  "Керчь": [45.338, 36.468],
  "Нефтеюганск": [61.099, 72.603],
  "Новый Уренгой": [66.083, 76.633],
  "Нижневартовск": [60.939, 76.569],
  "Уссурийск": [43.797, 131.946],
  "Иваново": [57.000, 40.974],
  "Сургут": [61.254, 73.396],
  "Салехард": [66.530, 66.613],
  "Орёл": [52.970, 36.064],
  "Мурманск": [68.970, 33.075],
  "Самара": [53.195, 50.101],
  "Витязево": [44.994, 37.270],
  "Балашиха": [55.809, 37.958]
};




export function updateCitiesWithTariffs(
  initialCities: City[],
  apiData: { units?: ApiUnit[] }
): City[] {
  if (!apiData?.units) return initialCities;

  // Создаем карту городов из initialCities для быстрого доступа
  const initialCitiesMap = new Map<string, City>();
  initialCities.forEach(city => {
    initialCitiesMap.set(city.id, city);
  });

  const result: City[] = [];

  apiData.units.forEach((unit: ApiUnit) => {
    // Проверяем, есть ли город в initialCities
    const existingCity = initialCitiesMap.get(unit.id);
    
    // Форматируем тарифы
    const newTariffs = unit.tarifs
      .filter(tarif => tarif?.id && tarif?.title)
      .map(tarif => ({
        tariffId: parseInt(tarif.id),
        name: normalizeTariffName(tarif.title)
      }));

    // Если город найден в initialCities
    if (existingCity) {
      result.push({
        ...existingCity,
        tariffs: newTariffs
      });
    } 
    // Если город новый - создаем его
    else {
      // Пробуем найти координаты по названию города
      const coords = findCityCoordinates(unit.title);
      
      if (coords) {
        
        //  Убираем Москву, Балашиху и Подольск
        if (!(["20", "36", "45" ].includes(unit.id))) {

          result.push({
            id: unit.id,
            name: unit.title.replace(/^talkdrive\s*|^taikdrive\s*/i, ''),
            coords: coords,
            tariffs: newTariffs
          });
        }
      } else {
        console.warn(`Не удалось найти координаты для города: ${unit.title}`);
      }
    }
  });

  return result;
}

// Вспомогательная функция для поиска координат по названию города
function findCityCoordinates(cityName: string): [number, number] | null {
  // Нормализация названия
  const normalized = cityName
    .replace(/^talkdrive\s*|^taikdrive\s*/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim()
    .toLowerCase();

  // Поиск в дополнительном словаре
  for (const [name, coords] of Object.entries(additionalCityCoordinates)) {
    if (name.toLowerCase() === normalized) {
      return coords;
    }
  }
  
  return null;
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