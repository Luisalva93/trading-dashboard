const express = require('express');
const router = express.Router();
const { pool } = require('../db/init');

router.get('/', async (req, res) => {
  const { year, month } = req.query;
  try {
    const dayResult = await pool.query(`
      SELECT 
        TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
        SUM(t.pnl) AS pnl,
        COUNT(t.id) AS num_trades,
        COUNT(CASE WHEN t.pnl > 0 THEN 1 END) AS winning_trades,
        COUNT(CASE WHEN t.pnl < 0 THEN 1 END) AS losing_trades,
        td.notes
      FROM trades t
      LEFT JOIN trade_days td ON td.date = t.date
      WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2
      GROUP BY t.date, td.notes
      ORDER BY t.date ASC
    `, [year, month]);
    res.json(dayResult.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/day/:date', async (req, res) => {
  try {
    const tradesResult = await pool.query(`SELECT * FROM trades WHERE date = $1 ORDER BY created_at ASC`, [req.params.date]);
    const dayResult = await pool.query(`SELECT notes FROM trade_days WHERE date = $1`, [req.params.date]);
    res.json({ trades: tradesResult.rows, notes: dayResult.rows[0]?.notes || '' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  try {
    const basicResult = await pool.query(`
      SELECT
        SUM(pnl) AS total_pnl,
        COUNT(*) AS total_trades,
        COUNT(CASE WHEN pnl > 0 THEN 1 END) AS winning_trades,
        COUNT(CASE WHEN pnl < 0 THEN 1 END) AS losing_trades,
        AVG(CASE WHEN pnl > 0 THEN pnl END) AS avg_win,
        AVG(CASE WHEN pnl < 0 THEN pnl END) AS avg_loss,
        SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) AS gross_profit,
        ABS(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END)) AS gross_loss
      FROM trades
      WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
    `, [year, month]);

    const dailyResult = await pool.query(`
      SELECT SUM(pnl)::float AS day_pnl
      FROM trades
      WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
      GROUP BY date ORDER BY date ASC
    `, [year, month]);

    const dailyPnls = dailyResult.rows.map(r => parseFloat(r.day_pnl));

    // Sharpe Ratio
    let sharpeRatio = null;
    if (dailyPnls.length > 1) {
      const mean = dailyPnls.reduce((s, v) => s + v, 0) / dailyPnls.length;
      const variance = dailyPnls.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (dailyPnls.length - 1);
      const stddev = Math.sqrt(variance);
      sharpeRatio = stddev > 0 ? parseFloat((mean / stddev * Math.sqrt(dailyPnls.length)).toFixed(2)) : null;
    }

    // Recovery Factor = total_pnl / max_drawdown
    let recoveryFactor = null;
    let maxDrawdown = 0;
    if (dailyPnls.length > 0) {
      let cumulative = 0, peak = 0, maxDD = 0;
      for (const pnl of dailyPnls) {
        cumulative += pnl;
        if (cumulative > peak) peak = cumulative;
        const dd = peak - cumulative;
        if (dd > maxDD) maxDD = dd;
      }
      maxDrawdown = parseFloat(maxDD.toFixed(2));
      const totalPnl = parseFloat(basicResult.rows[0].total_pnl);
      recoveryFactor = maxDD > 0 ? parseFloat((totalPnl / maxDD).toFixed(2)) : null;
    }

    res.json({ ...basicResult.rows[0], sharpe_ratio: sharpeRatio, recovery_factor: recoveryFactor, max_drawdown: maxDrawdown });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/trade', async (req, res) => {
  const { date, pnl, instrument, setup, entry_time } = req.body;
  if (!date || pnl === undefined) return res.status(400).json({ error: 'date and pnl required' });
  try {
    const result = await pool.query(`INSERT INTO trades (date, pnl, instrument, setup, entry_time) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [date, pnl, instrument || 'NQ', setup || '', entry_time || '']);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/trade/:id', async (req, res) => {
  const { pnl, instrument, setup, entry_time } = req.body;
  try {
    const result = await pool.query(`UPDATE trades SET pnl=$1, instrument=$2, setup=$3, entry_time=$4 WHERE id=$5 RETURNING *`, [pnl, instrument || 'NQ', setup || '', entry_time || '', req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/trade/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trades WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notes', async (req, res) => {
  const { date, notes } = req.body;
  try {
    await pool.query(`INSERT INTO trade_days (date, notes, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (date) DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()`, [date, notes]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/day/:date', async (req, res) => {
  try {
    await pool.query('DELETE FROM trades WHERE date = $1', [req.params.date]);
    await pool.query('DELETE FROM trade_days WHERE date = $1', [req.params.date]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
