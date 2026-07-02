const express = require('express');
const router = express.Router();
const { pool } = require('../db/init');

router.post('/monthly', async (req, res) => {
  const { year, month } = req.body;
  if (!year || !month) return res.status(400).json({ error: 'year y month requeridos' });

  try {
    // Get all trades for the month
    const tradesResult = await pool.query(`
      SELECT t.*, td.notes as day_notes
      FROM trades t
      LEFT JOIN trade_days td ON td.date = t.date
      WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2
      ORDER BY t.date ASC, t.created_at ASC
    `, [year, month]);

    // Get day summaries
    const daysResult = await pool.query(`
      SELECT 
        t.date::text,
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

    const hasNotes = daysResult.rows.some(d => d.notes && d.notes.trim().length > 0);

    // Build context for Claude
    const monthNames = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = monthNames[parseInt(month)];

    let context = `Eres un coach de trading especializado en psicología del trading y análisis de patrones emocionales. Analiza el siguiente registro de trading de ${monthName} ${year}.\n\n`;

    context += `=== RESUMEN DEL MES ===\n`;
    const totalPnl = daysResult.rows.reduce((s, d) => s + parseFloat(d.day_pnl), 0);
    const totalTrades = tradesResult.rows.length;
    const winTrades = tradesResult.rows.filter(t => parseFloat(t.pnl) > 0).length;
    context += `P&L Total: $${totalPnl.toFixed(2)}\n`;
    context += `Días operados: ${daysResult.rows.length}\n`;
    context += `Total trades: ${totalTrades}\n`;
    context += `Win rate trades: ${Math.round((winTrades/totalTrades)*100)}%\n\n`;

    context += `=== DETALLE POR DÍA ===\n`;
    daysResult.rows.forEach(day => {
      const [y, m, d] = day.date.split('-').map(Number);
      const fecha = new Date(y, m-1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
      context += `\n📅 ${fecha}\n`;
      context += `  P&L: $${parseFloat(day.day_pnl).toFixed(2)} | Trades: ${day.total_trades} | ${day.wins}W/${day.losses}L\n`;
      if (day.notes && day.notes.trim()) {
        context += `  Notas: "${day.notes.trim()}"\n`;
      }

      // Add individual trades
      const dayTrades = tradesResult.rows.filter(t => t.date.slice(0,10) === day.date);
      dayTrades.forEach((t, i) => {
        context += `  Trade ${i+1}: ${t.instrument || 'NQ'} ${t.setup ? `(${t.setup})` : ''} ${t.entry_time || ''} → $${parseFloat(t.pnl).toFixed(2)}\n`;
      });
    });

    context += `\n=== INSTRUCCIONES DE ANÁLISIS ===\n`;
    context += `Analiza este registro y proporciona:\n`;
    context += `1. **Patrones emocionales detectados** - identifica emociones específicas mencionadas o implícitas (revenge trading, FOMO, miedo, euforia, frustración, sobreconfianza, duda)\n`;
    context += `2. **Correlación emoción-resultado** - ¿en qué tipo de días aparecen ciertas emociones? ¿después de pérdidas? ¿con muchos trades?\n`;
    context += `3. **Patrones de comportamiento** - overtrading, cortar ganancias pronto, dejar correr pérdidas, operar fuera del plan\n`;
    context += `4. **Fortalezas identificadas** - qué hace bien el trader\n`;
    context += `5. **Recomendaciones concretas** - 3 acciones específicas para mejorar\n`;
    if (!hasNotes) {
      context += `\nNota: El trader no registró notas escritas este mes. Analiza basándote en los patrones numéricos: secuencias de pérdidas, número de trades por día, variación de P&L, etc.\n`;
    }
    context += `\nResponde en español, con tono de coach profesional pero cercano. Sé directo y específico. Usa los datos reales del registro.`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: context }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'Error al conectar con la IA. Verifica tu API key.' });
    }

    const data = await response.json();
    const analysis = data.content[0].text;
    res.json({ analysis, month: monthName, year, totalPnl, totalTrades, winRate: Math.round((winTrades/totalTrades)*100) });

  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
