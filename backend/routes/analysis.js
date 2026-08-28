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

// Monthly analysis for one session
router.post('/monthly', async (req, res) => {
  const { year, month, session = 'NY' } = req.body;
  if (!year || !month) return res.status(400).json({ error: 'year y month requeridos' });
  try {
    const tradesResult = await pool.query(`
      SELECT TO_CHAR(t.date, 'YYYY-MM-DD') AS date, t.pnl, t.instrument, t.setup, t.entry_time, td.notes AS day_notes
      FROM trades t
      LEFT JOIN trade_days td ON td.date = t.date AND td.session = t.session
      WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2 AND t.session = $3
      ORDER BY t.date ASC, t.created_at ASC
    `, [year, month, session]);

    const daysResult = await pool.query(`
      SELECT TO_CHAR(t.date, 'YYYY-MM-DD') AS date, SUM(t.pnl) AS day_pnl,
        COUNT(*) AS total_trades, COUNT(CASE WHEN t.pnl > 0 THEN 1 END) AS wins,
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

    const sessionLabel = session === 'NY' ? 'New York (NY)' : 'London (LDN)';
    let context = `Eres un coach de trading especializado en psicología del trading. Analiza el registro de ${monthName} ${year} — Sesión ${sessionLabel}.\n\n`;
    context += `P&L Total: $${totalPnl.toFixed(2)} | Días: ${daysResult.rows.length} | Trades: ${totalTrades} | Win rate: ${Math.round((winTrades/totalTrades)*100)}%\n\n=== DETALLE POR DÍA ===\n`;

    daysResult.rows.forEach(day => {
      const [y, m, d] = day.date.split('-').map(Number);
      const fecha = new Date(y, m-1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
      context += `\n${fecha} | P&L: $${parseFloat(day.day_pnl).toFixed(2)} | ${day.wins}W/${day.losses}L\n`;
      if (day.notes?.trim()) context += `  Notas: "${day.notes.trim()}"\n`;
      tradesResult.rows.filter(t => t.date === day.date).forEach((t, i) => {
        context += `  Trade ${i+1}: $${parseFloat(t.pnl).toFixed(2)} ${t.entry_time || ''}\n`;
      });
    });

    context += `\nAnaliza en español con tono de coach profesional:\n1. **Patrones emocionales detectados**\n2. **Correlación emoción-resultado**\n3. **Patrones de comportamiento**\n4. **Fortalezas identificadas**\n5. **3 recomendaciones concretas**`;

    const response = await anthropicPost({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: context }] });
    if (response.status !== 200) return res.status(500).json({ error: 'Error al conectar con la IA.' });

    res.json({ analysis: response.data.content[0].text, month: monthName, year, session, totalPnl, totalTrades, winRate: Math.round((winTrades/totalTrades)*100) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Compare NY vs London
router.post('/compare', async (req, res) => {
  const { year, month } = req.body;
  try {
    const getSummary = async (session) => {
      const result = await pool.query(`
        SELECT SUM(pnl) AS total_pnl, COUNT(*) AS total_trades,
          COUNT(CASE WHEN pnl > 0 THEN 1 END) AS wins,
          COUNT(DISTINCT date) AS traded_days,
          AVG(CASE WHEN pnl > 0 THEN pnl END) AS avg_win,
          ABS(AVG(CASE WHEN pnl < 0 THEN pnl END)) AS avg_loss,
          SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) AS gross_profit,
          ABS(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END)) AS gross_loss
        FROM trades
        WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2 AND session = $3
      `, [year, month, session]);
      return result.rows[0];
    };

    const ny = await getSummary('NY');
    const ldn = await getSummary('LDN');

    const monthNames = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = monthNames[parseInt(month)];

    const hasBoth = parseInt(ny.total_trades) > 0 && parseInt(ldn.total_trades) > 0;
    if (!hasBoth) return res.status(400).json({ error: 'Necesitas trades en ambas sesiones para comparar.' });

    const nyPF = parseFloat(ny.gross_loss) > 0 ? (parseFloat(ny.gross_profit) / parseFloat(ny.gross_loss)).toFixed(2) : '∞';
    const ldnPF = parseFloat(ldn.gross_loss) > 0 ? (parseFloat(ldn.gross_profit) / parseFloat(ldn.gross_loss)).toFixed(2) : '∞';
    const nyWR = Math.round((parseInt(ny.wins) / parseInt(ny.total_trades)) * 100);
    const ldnWR = Math.round((parseInt(ldn.wins) / parseInt(ldn.total_trades)) * 100);

    let context = `Eres un coach de trading especializado. Compara el rendimiento de dos sesiones de trading en ${monthName} ${year}.\n\n`;
    context += `=== NEW YORK (NY) ===\nP&L: $${parseFloat(ny.total_pnl).toFixed(2)} | Trades: ${ny.total_trades} | Win Rate: ${nyWR}% | Profit Factor: ${nyPF}\nAvg Win: $${parseFloat(ny.avg_win||0).toFixed(0)} | Avg Loss: -$${parseFloat(ny.avg_loss||0).toFixed(0)} | Días: ${ny.traded_days}\n\n`;
    context += `=== LONDON (LDN) ===\nP&L: $${parseFloat(ldn.total_pnl).toFixed(2)} | Trades: ${ldn.total_trades} | Win Rate: ${ldnWR}% | Profit Factor: ${ldnPF}\nAvg Win: $${parseFloat(ldn.avg_win||0).toFixed(0)} | Avg Loss: -$${parseFloat(ldn.avg_loss||0).toFixed(0)} | Días: ${ldn.traded_days}\n\n`;
    context += `Proporciona en español:\n1. **¿En qué sesión opera mejor?** Con datos específicos\n2. **Diferencias clave** entre ambas sesiones\n3. **Fortalezas y debilidades** de cada sesión\n4. **Recomendación concreta** — ¿dónde enfocarse más?\n5. **Distribución sugerida** de tiempo/capital entre sesiones`;

    const response = await anthropicPost({ model: 'claude-haiku-4-5-20251001', max_tokens: 1200, messages: [{ role: 'user', content: context }] });
    if (response.status !== 200) return res.status(500).json({ error: 'Error al conectar con la IA.' });

    res.json({
      analysis: response.data.content[0].text, month: monthName, year,
      ny: { pnl: parseFloat(ny.total_pnl), trades: parseInt(ny.total_trades), winRate: nyWR, profitFactor: nyPF },
      ldn: { pnl: parseFloat(ldn.total_pnl), trades: parseInt(ldn.total_trades), winRate: ldnWR, profitFactor: ldnPF },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
