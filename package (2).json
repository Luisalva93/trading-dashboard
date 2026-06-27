const BASE = process.env.REACT_APP_API_URL || '';

export async function fetchTrades(year, month) {
  const res = await fetch(`${BASE}/api/trades?year=${year}&month=${month}`);
  if (!res.ok) throw new Error('Error cargando trades');
  return res.json();
}

export async function fetchMonths() {
  const res = await fetch(`${BASE}/api/trades/months`);
  if (!res.ok) throw new Error('Error cargando meses');
  return res.json();
}

export async function saveTrade(data) {
  const res = await fetch(`${BASE}/api/trades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error guardando trade');
  return res.json();
}

export async function deleteTrade(date) {
  const res = await fetch(`${BASE}/api/trades/${date}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando trade');
  return res.json();
}
