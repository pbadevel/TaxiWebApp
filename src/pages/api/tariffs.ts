import type { NextApiRequest, NextApiResponse } from 'next';

interface ApiTariffsResponse {
  result: string;
  error: string;
  units: ApiUnit[];
}
interface ApiUnit {
  id: string;
  title: string;
  tarifs: ApiTariff[];
}

interface ApiTariff {
  id: string;
  title: string;
  // Добавьте другие поля из ответа API при необходимости
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiTariffsResponse | { error: string }>) {
   const login = process.env.NEXT_PUBLIC_TAXI_OPERATOR_LOGIN;
   const password = process.env.NEXT_PUBLIC_TAXI_OPERATOR_PASSWORD;
    

  if (!login || !password) {
    return res.status(500).json({ error: 'Credentials not configured' });
  }

  try {
    const apiUrl = `https://talkdrive.taxomet.ru/api/v1/get_tariffs?operator_login=${login}&operator_password=${password}`;
    const apiRes = await fetch(apiUrl);
    
    if (!apiRes.ok) throw new Error(`API responded with status ${apiRes.status}`);
    
    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "some error" });
  }
}