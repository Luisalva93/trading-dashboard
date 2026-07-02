const express = require('express');
const router = express.Router();
const { pool } = require('../db/init');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM date)::int AS year,
        EXTRACT(MONTH FROM date)::int AS month,
        SUM(pnl) AS total_pnl,
        COUNT(*) AS total_trades,
        COUNT(CASE WHEN pnl > 0 THEN 1 END) AS winning_trades,
        COUNT(DISTINCT date) AS traded_days,
        MAX(pnl) AS best_trade,
        MIN(pnl) AS worst_trade,
        SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) AS gross_profit,
        ABS(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END)) AS gross_loss
      FROM trades
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year DESC, month DESC
    `);

    const months = await Promise.all(result.rows.map(async (row) => {
      const dailyResult = await pool.query(`
        SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, SUM(pnl) AS day_pnl
        FROM trades
        WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
        GROUP BY date ORDER BY date ASC
      `, [row.year, row.month]);

      let cumulative = 0;
      const sparkline = dailyResult.rows.map(d => {
        cumulative += parseFloat(d.day_pnl);
        return parseFloat(cumulative.toFixed(2));
      });

      const winRateTrades = parseInt(row.total_trades) > 0
        ? Math.round((parseInt(row.winning_trades) / parseInt(row.total_trades)) * 100) : 0;

      const profitFactor = parseFloat(row.gross_loss) > 0
        ? (parseFloat(row.gross_profit) / parseFloat(row.gross_loss)).toFixed(2)
        : parseFloat(row.gross_profit) > 0 ? '∞' : '0';

      return { ...row, sparkline, winRateTrades, profitFactor };
    }));

    res.json(months);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
