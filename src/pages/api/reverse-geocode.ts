import type { NextApiRequest, NextApiResponse } from 'next';

export default async function getAddressByCoords(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { lat, lon } = req.query;

  if (typeof lat !== 'string' || typeof lon !== 'string') {
    res.status(400).json({ error: 'Invalid query parameters' });
    return;
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YourAppName/1.0', // рекомендуется указывать User-Agent
      },
    });
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}