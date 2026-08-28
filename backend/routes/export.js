const express = require('express');
const router = express.Router();
const { pool } = require('../db/init');

router.get('/csv', async (req, res) => {
  const { session } = req.query;
  try {
    let query = `
      SELECT TO_CHAR(t.date, 'YYYY-MM-DD') AS fecha, t.pnl, t.session AS sesion,
        t.instrument AS instrumento, t.setup, t.entry_time AS hora_entrada,
        td.notes AS notas_del_dia
      FROM trades t
      LEFT JOIN trade_days td ON td.date = t.date AND td.session = t.session
    `;
    const params = [];
    if (session) { query += ' WHERE t.session = $1'; params.push(session); }
    query += ' ORDER BY t.date ASC, t.created_at ASC';

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No hay trades para exportar' });

    const headers = ['Fecha', 'P&L', 'Sesion', 'Instrumento', 'Setup', 'Hora Entrada', 'Notas del Día'];
    const rows = result.rows.map(r => [
      r.fecha, r.pnl, r.sesion, r.instrumento || 'MNQ', r.setup || '',
      r.hora_entrada || '', (r.notas_del_dia || '').replace(/,/g, ';').replace(/\n/g, ' '),
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const filename = session ? `trading-${session}-${new Date().toISOString().slice(0,10)}.csv` : `trading-all-${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/json', async (req, res) => {
  const { session } = req.query;
  try {
    let query = `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, pnl, session, instrument, setup, entry_time FROM trades`;
    const params = [];
    if (session) { query += ' WHERE session = $1'; params.push(session); }
    query += ' ORDER BY date ASC';

    const trades = await pool.query(query, params);
    let notesQuery = `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, notes, session FROM trade_days`;
    const notesParams = [];
    if (session) { notesQuery += ' WHERE session = $1'; notesParams.push(session); }

    const notes = await pool.query(notesQuery, notesParams);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="trading-backup-${new Date().toISOString().slice(0,10)}.json"`);
    res.json({ trades: trades.rows, notes: notes.rows, exported_at: new Date().toISOString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/import-csv', async (req, res) => {
  const { rows, session = 'NY' } = req.body;
  if (!rows || !Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ error: 'No se recibieron datos válidos' });

  let inserted = 0, skipped = 0, errors = 0;
  for (const row of rows) {
    try {
      const { fecha, pnl, sesion, instrumento, setup, hora_entrada, notas_del_dia } = row;
      if (!fecha || pnl === '' || pnl === undefined) { skipped++; continue; }
      const tradeSession = sesion || session;
      await pool.query(`INSERT INTO trades (date, pnl, instrument, setup, entry_time, session) VALUES ($1, $2, $3, $4, $5, $6)`,
        [fecha, parseFloat(pnl), instrumento || 'MNQ', setup || '', hora_entrada || '', tradeSession]);
      if (notas_del_dia?.trim()) {
        await pool.query(`INSERT INTO trade_days (date, notes, session, updated_at) VALUES ($1, $2, $3, NOW())
          ON CONFLICT (date, session) DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()`,
          [fecha, notas_del_dia.trim(), tradeSession]);
      }
      inserted++;
    } catch (e) { console.error('Import row error:', e.message); errors++; }
  }
  res.json({ inserted, skipped, errors, total: rows.length });
});

module.exports = router;
