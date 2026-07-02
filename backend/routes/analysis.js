const express = require('express');
const router = express.Router();
const { pool } = require('../db/init');
const https = require('https');

function anthropicPost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
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
    req.write(data);
    req.end();
  });
}

router.post('/monthly', async (req, res) => {
  const { year, month } = req.body;
  if (!year || !month) return res.status(400).json({ error: 'year y month requeridos' });

  try {
    const tradesResult = await pool.query(`
      SELECT 
        t.id,
        TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
        t.pnl, t.instrument, t.setup, t.entry_time,
        td.notes AS day_notes
      FROM trades t
      LEFT JOIN trade_days td ON td.date = t.date
      WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2
      ORDER BY t.date ASC, t.created_at ASC
    `, [year, month]);

    const daysResult = await pool.query(`
      SELECT 
        TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
        SUM(t.pnl) AS day_pnl,
        COUNT(*) AS total_trades,
        COUNT(CASE WHEN t.pnl > 0 THEN 1 END) AS wins,
        COUNT(CASE WHEN t.pnl < 0 THEN 1 END) AS losses,
        td.notes
      FROM trades t
      LEFT JOIN trade_days td ON td.date = t.date
      WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2
      GROUP BY t.date, td.notes
      ORDER BY t.date ASC
    `, [year, month]);

    if (tradesResult.rows.length === 0) {
      return res.status(400).json({ error: 'No hay trades registrados en este mes para analizar.' });
    }

    const monthNames = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = monthNames[parseInt(month)];
    const totalPnl = daysResult.rows.reduce((s, d) => s + parseFloat(d.day_pnl), 0);
    const totalTrades = tradesResult.rows.length;
    const winTrades = tradesResult.rows.filter(t => parseFloat(t.pnl) > 0).length;

    let context = `Eres un coach de trading especializado en psicología del trading. Analiza el registro de ${monthName} ${year}.\n\n`;
    context += `P&L Total: $${totalPnl.toFixed(2)} | Días: ${daysResult.rows.length} | Trades: ${totalTrades} | Win rate: ${Math.round((winTrades/totalTrades)*100)}%\n\n`;
    context += `=== DETALLE POR DÍA ===\n`;

    daysResult.rows.forEach(day => {
      const [y, m, d] = day.date.split('-').map(Number);
      const fecha = new Date(y, m-1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
      context += `\n${fecha} | P&L: $${parseFloat(day.day_pnl).toFixed(2)} | ${day.wins}W/${day.losses}L\n`;
      if (day.notes && day.notes.trim()) context += `  Notas: "${day.notes.trim()}"\n`;
      tradesResult.rows.filter(t => t.date === day.date).forEach((t, i) => {
        context += `  Trade ${i+1}: ${t.instrument||'NQ'} ${t.setup||''} ${t.entry_time||''} $${parseFloat(t.pnl).toFixed(2)}\n`;
      });
    });

    context += `\nAnaliza y proporciona en español:\n1. **Patrones emocionales detectados** (revenge, FOMO, miedo, euforia)\n2. **Correlación emoción-resultado** \n3. **Patrones de comportamiento** (overtrading, cortar ganancias pronto)\n4. **Fortalezas identificadas**\n5. **3 recomendaciones concretas**\nSé directo, usa los datos reales.`;

    const response = await anthropicPost({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: context }],
    });

    if (response.status !== 200) {
      console.error('Anthropic error:', response.data);
      return res.status(500).json({ error: 'Error al conectar con la IA. Verifica tu API key.' });
    }

    res.json({
      analysis: response.data.content[0].text,
      month: monthName, year, totalPnl, totalTrades,
      winRate: Math.round((winTrades/totalTrades)*100)
    });

  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
