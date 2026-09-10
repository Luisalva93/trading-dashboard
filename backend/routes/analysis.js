const express = require('express');
const router = express.Router();
const { pool } = require('../db/init');
const https = require('https');

function anthropicPost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(raw) }));
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

// Single session analysis
router.post('/monthly', async (req, res) => {
  const { year, month, session = 'NY' } = req.body;
  try {
    const tradesResult = await pool.query(`
      SELECT TO_CHAR(t.date, 'YYYY-MM-DD') AS date, t.pnl, t.instrument, t.setup, t.entry_time, t.notes AS trade_notes, td.notes AS day_notes
      FROM trades t
      LEFT JOIN trade_days td ON td.date = t.date AND td.session = t.session
      WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2 AND t.session = $3
      ORDER BY t.date ASC, t.created_at ASC
    `, [year, month, session]);

    const daysResult = await pool.query(`
      SELECT TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
        SUM(t.pnl) AS day_pnl, COUNT(*) AS total_trades,
        COUNT(CASE WHEN t.pnl > 0 THEN 1 END) AS wins,
        COUNT(CASE WHEN t.pnl < 0 THEN 1 END) AS losses, td.notes
      FROM trades t
      LEFT JOIN trade_days td ON td.date = t.date AND td.session = t.session
      WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2 AND t.session = $3
      GROUP BY t.date, td.notes ORDER BY t.date ASC
    `, [year, month, session]);

    if (tradesResult.rows.length === 0)
      return res.status(400).json({ error: 'No hay trades registrados en este mes para analizar.' });

    const monthNames = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = monthNames[parseInt(month)];
    const totalPnl = daysResult.rows.reduce((s, d) => s + parseFloat(d.day_pnl), 0);
    const totalTrades = tradesResult.rows.length;
    const winTrades = tradesResult.rows.filter(t => parseFloat(t.pnl) > 0).length;
    const sessionLabels = { NY: 'New York (NY)', LDN: 'London (LDN)', ASIA: 'Asia' };
    const sessionLabel = sessionLabels[session] || session;

    let context = `Eres un coach de trading especializado en psicología del trading. Analiza el registro de la sesión ${sessionLabel} en ${monthName} ${year}.\n\n`;
    context += `P&L Total: $${totalPnl.toFixed(2)} | Días: ${daysResult.rows.length} | Trades: ${totalTrades} | Win rate: ${Math.round((winTrades/totalTrades)*100)}%\n\n=== DETALLE POR DÍA ===\n`;

    daysResult.rows.forEach(day => {
      const [y, m, d] = day.date.split('-').map(Number);
      const fecha = new Date(y, m-1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
      context += `\n${fecha} | P&L: $${parseFloat(day.day_pnl).toFixed(2)} | ${day.wins}W/${day.losses}L\n`;
      if (day.notes?.trim()) context += `  Notas del día: "${day.notes.trim()}"\n`;
      tradesResult.rows.filter(t => t.date === day.date).forEach((t, i) => {
        context += `  Trade ${i+1}: ${t.instrument||'MNQ'} ${t.setup||''} ${t.entry_time||''} $${parseFloat(t.pnl).toFixed(2)}`;
        if (t.trade_notes?.trim()) context += ` | Nota: "${t.trade_notes.trim()}"`;
        context += '\n';
      });
    });

    context += `\nAnaliza en español:\n1. **Patrones emocionales detectados**\n2. **Correlación emoción-resultado**\n3. **Patrones de comportamiento**\n4. **Fortalezas identificadas**\n5. **3 recomendaciones concretas**\nSé directo y usa los datos reales.`;

    const response = await anthropicPost({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: context }] });
    if (response.status !== 200) return res.status(500).json({ error: 'Error al conectar con la IA.' });

    res.json({ analysis: response.data.content[0].text, month: monthName, year, totalPnl, totalTrades, winRate: Math.round((winTrades/totalTrades)*100), session });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Compare NY vs London vs Asia
router.post('/compare', async (req, res) => {
  const { year, month } = req.body;
  try {
    const getSessionData = async (session) => {
      const trades = await pool.query(`
        SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, pnl
        FROM trades WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2 AND session = $3
        ORDER BY date ASC
      `, [year, month, session]);

      if (trades.rows.length === 0) return null;

      const totalPnl = trades.rows.reduce((s, t) => s + parseFloat(t.pnl), 0);
      const wins = trades.rows.filter(t => parseFloat(t.pnl) > 0).length;
      const grossProfit = trades.rows.filter(t => parseFloat(t.pnl) > 0).reduce((s, t) => s + parseFloat(t.pnl), 0);
      const grossLoss = Math.abs(trades.rows.filter(t => parseFloat(t.pnl) < 0).reduce((s, t) => s + parseFloat(t.pnl), 0));
      const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : '∞';
      const losses = trades.rows.length - wins;
      const avgWin = wins > 0 ? (grossProfit / wins).toFixed(0) : '0';
      const avgLoss = losses > 0 ? (grossLoss / losses).toFixed(0) : '0';

      return { totalPnl: totalPnl.toFixed(2), totalTrades: trades.rows.length, winRate: Math.round((wins/trades.rows.length)*100), profitFactor, avgWin, avgLoss };
    };

    const [nyData, ldnData, asiaData] = await Promise.all([
      getSessionData('NY'),
      getSessionData('LDN'),
      getSessionData('ASIA'),
    ]);

    if (!nyData && !ldnData && !asiaData)
      return res.status(400).json({ error: 'No hay datos en ninguna sesión para este mes.' });

    const monthNames = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = monthNames[parseInt(month)];

    let context = `Eres un coach de trading. Compara el rendimiento en ${monthName} ${year} entre las sesiones de trading:\n\n`;

    const sessions = [
      { label: '🗽 NEW YORK', data: nyData },
      { label: '🇬🇧 LONDON', data: ldnData },
      { label: '🌏 ASIA', data: asiaData },
    ];

    sessions.forEach(s => {
      if (s.data) {
        context += `${s.label}:\n- P&L: $${s.data.totalPnl}\n- Trades: ${s.data.totalTrades}\n- Win Rate: ${s.data.winRate}%\n- Profit Factor: ${s.data.profitFactor}\n- Avg Win: $${s.data.avgWin} | Avg Loss: $${s.data.avgLoss}\n\n`;
      } else {
        context += `${s.label}: Sin datos este mes\n\n`;
      }
    });

    context += `Analiza en español:\n1. **¿En qué sesión opera mejor y por qué?**\n2. **Diferencias clave entre sesiones**\n3. **Riesgos identificados en cada sesión**\n4. **Recomendación: ¿en qué sesión(es) enfocarse?**\n5. **2 acciones concretas para mejorar cada sesión activa**\nSé directo con los números reales.`;

    const response = await anthropicPost({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: context }] });
    if (response.status !== 200) return res.status(500).json({ error: 'Error al conectar con la IA.' });

    res.json({ analysis: response.data.content[0].text, month: monthName, year, nyData, ldnData, asiaData });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
