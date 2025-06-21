export async function getDistanceTariff(
  unitId: number|string = 4,
  tarifId: number = 2,
  points: [number, number][]
): Promise<{
  distance: number;
  min_price: string;
  pre_price: string;
  fix_price: string;
  execution_time: string;
  nodes: any[];
  [key: string]: any;
}> {
  try {
    const baseAddres = process.env.NEXT_PUBLIC_BASE_PATH;

    const response = await fetch(`${baseAddres}${baseAddres}/api/calculate-taxi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unitId,
        tarifId,
        points
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
     if (data.result === "1") {
      return {
        ...data,
        distance: data.distance || 0,
        min_price: data.fix_price_raw	 || '0',
        pre_price: data.fix_price_raw	 || '0',
        fix_price: data.fix_price_raw	 || '0',
        execution_time: data.execution_time || '',
        nodes: data.nodes || []
      };
    } else {
      throw new Error(data.error || 'Unknown error from API');
    }
  } catch (error) {
    console.error('Ошибка расчета стоимости:', error);
    return {
      distance: 0,
      min_price: '0',
      pre_price: '0',
      fix_price: '0',
      execution_time: '',
      nodes: []
    };
  }
}