const express = require('express');
const router = express.Router();
const { pool } = require('../db/init');

// GET all trades for a given month: /api/trades?year=2025&month=4
router.get('/', async (req, res) => {
  const { year, month } = req.query;
  try {
    let query = 'SELECT * FROM trade_days';
    let params = [];
    if (year && month) {
      query += ' WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2';
      params = [year, month];
    }
    query += ' ORDER BY date ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all available months
router.get('/months', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT 
        EXTRACT(YEAR FROM date)::int AS year, 
        EXTRACT(MONTH FROM date)::int AS month
      FROM trade_days
      ORDER BY year DESC, month DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - create or update a trade day
router.post('/', async (req, res) => {
  const { date, pnl, num_trades, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });
  try {
    const result = await pool.query(`
      INSERT INTO trade_days (date, pnl, num_trades, notes, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (date) DO UPDATE SET
        pnl = EXCLUDED.pnl,
        num_trades = EXCLUDED.num_trades,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `, [date, pnl || 0, num_trades || 0, notes || '']);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a trade day
router.delete('/:date', async (req, res) => {
  try {
    await pool.query('DELETE FROM trade_days WHERE date = $1', [req.params.date]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
