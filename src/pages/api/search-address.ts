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
    const { unitId, query } = req.body;

    // Формируем параметры запроса
    const params = new URLSearchParams();

    params.append('unit_id', String(unitId));
    params.append('race_ind', String(0));
    params.append("q", query);

    // Выполняем запрос к API такси
    const apiUrl = 'http://talkdrive.taxomet.ru/ajax/get_adres_operator.php';

    const response = await fetch(`${apiUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Taxi API error: ${response.status}`);
    }
    
    const data = await response.text();
    return res.status(200).json({'data': data});
  } catch (error) {
    console.error('Taxi API error:', error);
    return res.status(500).json({ error: 'Failed to calculate route' });
  }
}