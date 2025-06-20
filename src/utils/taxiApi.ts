// utils/taxiApi.ts
interface CalculateRouteResponse {
  result: string;
  distance: string;
  pre_price: string;
  fix_price: string;
  error?: string;
  // Другие поля при необходимости
}

export const calculateRouteAndPrice = async (
  tarif_id: string,
  list_points: number[][]
): Promise<CalculateRouteResponse> => {
  const operator_login = process.env.NEXT_PUBLIC_TAXI_OPERATOR_LOGIN;
  const operator_password = process.env.NEXT_PUBLIC_TAXI_OPERATOR_PASSWORD;
  const unit_id = process.env.NEXT_PUBLIC_TAXI_UNIT_ID;

  if (!operator_login || !operator_password || !unit_id) {
    throw new Error('Taxi API credentials not configured');
  }

  const params = new URLSearchParams({
    operator_login,
    operator_password,
    unit_id,
    tarif_id,
  });

  // Добавляем координаты точек
  list_points.forEach(point => {
    params.append('lon[]', point[0].toString());
    params.append('lat[]', point[1].toString());
  });

  try {
    const response = await fetch(
      `https://talkdrive.taxomet.ru/api/v1/get_distance?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    return {
      result: '0',
      distance: '0',
      pre_price: '0',
      fix_price: '0',
      error: 'Service unavailable',
    };
  }
};