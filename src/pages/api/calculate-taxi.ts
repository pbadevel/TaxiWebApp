import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Обработка preflight запроса
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { unitId, tarifId, points } = req.body;

    const login = process.env.NEXT_PUBLIC_TAXI_OPERATOR_LOGIN;
    const password = process.env.NEXT_PUBLIC_TAXI_OPERATOR_PASSWORD;
    
    if (!login || !password) {
      return res.status(500).json({ error: 'API credentials not configured' });
    }

    // Формируем параметры запроса
    const params = new URLSearchParams();
    params.append('operator_login', login);
    params.append('operator_password', password);
    params.append('unit_id', String(unitId));
    params.append('tarif_id', String(tarifId));
    
    // Добавляем точки маршрута
    points.forEach((point: [number, number]) => {
      params.append('lon[]', point[0].toString());
      params.append('lat[]', point[1].toString());
    });

    // Выполняем запрос к API такси
    const apiUrl = 'https://talkdrive.taxomet.ru/api/v1/get_distance';
    const response = await fetch(`${apiUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Taxi API error: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Taxi API error:', error);
    return res.status(500).json({ error: 'Failed to calculate route' });
  }
}