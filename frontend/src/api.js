const BASE = process.env.REACT_APP_API_URL || '';

export async function fetchTrades(year, month) {
  const res = await fetch(`${BASE}/api/trades?year=${year}&month=${month}`);
  if (!res.ok) throw new Error('Error cargando trades');
  return res.json();
}

export async function fetchMonthStats(year, month) {
  const res = await fetch(`${BASE}/api/trades/stats/${year}/${month}`);
  if (!res.ok) throw new Error('Error cargando stats');
  return res.json();
}

export async function fetchDayTrades(date) {
  const res = await fetch(`${BASE}/api/trades/day/${date}`);
  if (!res.ok) throw new Error('Error cargando día');
  return res.json();
}

export async function addTrade(data) {
  const res = await fetch(`${BASE}/api/trades/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error guardando trade');
  return res.json();
}

export async function updateTrade(id, data) {
  const res = await fetch(`${BASE}/api/trades/trade/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error actualizando trade');
  return res.json();
}

export async function deleteTrade(id) {
  const res = await fetch(`${BASE}/api/trades/trade/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando trade');
  return res.json();
}

export async function saveNotes(date, notes) {
  const res = await fetch(`${BASE}/api/trades/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, notes }),
  });
  if (!res.ok) throw new Error('Error guardando notas');
  return res.json();
}

export async function deleteDay(date) {
  const res = await fetch(`${BASE}/api/trades/day/${date}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando día');
  return res.json();
}
