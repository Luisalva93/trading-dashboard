const express = require('express');
const router = express.Router();
const { pool } = require('../db/init');

// Export all trades as CSV
router.get('/csv', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(t.date, 'YYYY-MM-DD') AS fecha,
        t.pnl,
        t.instrument AS instrumento,
        t.setup,
        t.entry_time AS hora_entrada,
        td.notes AS notas_del_dia,
        t.created_at
      FROM trades t
      LEFT JOIN trade_days td ON td.date = t.date
      ORDER BY t.date ASC, t.created_at ASC
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay trades para exportar' });
    }

    const headers = ['Fecha', 'P&L', 'Instrumento', 'Setup', 'Hora Entrada', 'Notas del Día'];
    const rows = result.rows.map(r => [
      r.fecha,
      r.pnl,
      r.instrumento || 'NQ',
      r.setup || '',
      r.hora_entrada || '',
      (r.notas_del_dia || '').replace(/,/g, ';').replace(/\n/g, ' '),
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="trading-backup-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export as JSON (full backup)
router.get('/json', async (req, res) => {
  try {
    const trades = await pool.query(`
      SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, pnl, instrument, setup, entry_time, created_at
      FROM trades ORDER BY date ASC, created_at ASC
    `);
    const notes = await pool.query(`
      SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, notes
      FROM trade_days ORDER BY date ASC
    `);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="trading-backup-${new Date().toISOString().slice(0,10)}.json"`);
    res.json({ trades: trades.rows, notes: notes.rows, exported_at: new Date().toISOString() });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Import from CSV
router.post('/import-csv', async (req, res) => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No hay datos para importar' });
  }

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const { fecha, pnl, instrumento, setup, hora_entrada, notas_del_dia } = row;
      if (!fecha || pnl === undefined || pnl === '') { skipped++; continue; }

      const pnlNum = parseFloat(pnl);
      if (isNaN(pnlNum)) { skipped++; continue; }

      await pool.query(`
        INSERT INTO trades (date, pnl, instrument, setup, entry_time)
        VALUES ($1, $2, $3, $4, $5)
      `, [fecha, pnlNum, instrumento || 'NQ', setup || '', hora_entrada || '']);

      if (notas_del_dia && notas_del_dia.trim()) {
        await pool.query(`
          INSERT INTO trade_days (date, notes, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (date) DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()
        `, [fecha, notas_del_dia.trim()]);
      }

      imported++;
    } catch (err) {
      errors++;
    }
  }

  res.json({ imported, skipped, errors, total: rows.length });
});

// Import trades from CSV
router.post('/import-csv', async (req, res) => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No hay datos para importar' });
  }

  let inserted = 0, skipped = 0, errors = 0;
  const client = await require('../db/init').pool.connect();

  try {
    await client.query('BEGIN');

    for (const row of rows) {
      try {
        const { fecha, pnl, instrumento, setup, hora_entrada, notas_del_dia } = row;
        if (!fecha || pnl === undefined || pnl === '') { skipped++; continue; }

        const pnlNum = parseFloat(pnl);
        if (isNaN(pnlNum)) { skipped++; continue; }

        // Insert trade
        await client.query(`
          INSERT INTO trades (date, pnl, instrument, setup, entry_time)
          VALUES ($1, $2, $3, $4, $5)
        `, [fecha, pnlNum, instrumento || 'NQ', setup || '', hora_entrada || '']);

        // Insert notes if present
        if (notas_del_dia && notas_del_dia.trim()) {
          await client.query(`
            INSERT INTO trade_days (date, notes, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (date) DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()
          `, [fecha, notas_del_dia.trim()]);
        }

        inserted++;
      } catch (e) {
        errors++;
      }
    }

    await client.query('COMMIT');
    res.json({ inserted, skipped, errors, total: rows.length });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Import from CSV
router.post('/import-csv', async (req, res) => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No se recibieron datos válidos' });
  }

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const { fecha, pnl, instrumento, setup, hora_entrada, notas_del_dia } = row;
      if (!fecha || pnl === undefined || pnl === '') { skipped++; continue; }

      // Insert trade
      await pool.query(`
        INSERT INTO trades (date, pnl, instrument, setup, entry_time)
        VALUES ($1, $2, $3, $4, $5)
      `, [fecha, parseFloat(pnl), instrumento || 'NQ', setup || '', hora_entrada || '']);

      // Insert notes if present
      if (notas_del_dia && notas_del_dia.trim()) {
        await pool.query(`
          INSERT INTO trade_days (date, notes, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (date) DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()
        `, [fecha, notas_del_dia.trim()]);
      }

      inserted++;
    } catch (e) {
      console.error('Import row error:', e.message);
      errors++;
    }
  }

  res.json({ inserted, skipped, errors, total: rows.length });
});
