const express = require('express');
const router = express.Router();
const { pool } = require('../db/init');

router.get('/', async (req, res) => {
  const { session = 'NY' } = req.query;
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
      WHERE session = $1
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year DESC, month DESC
    `, [session]);

    const months = await Promise.all(result.rows.map(async (row) => {
      const dailyResult = await pool.query(`
        SELECT SUM(pnl)::float AS day_pnl
        FROM trades
        WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2 AND session = $3
        GROUP BY date ORDER BY date ASC
      `, [row.year, row.month, session]);

      const dailyPnls = dailyResult.rows.map(r => parseFloat(r.day_pnl));
      let cum = 0;
      const sparkline = dailyPnls.map(p => { cum += p; return parseFloat(cum.toFixed(2)); });

      const winRateTrades = parseInt(row.total_trades) > 0
        ? Math.round((parseInt(row.winning_trades) / parseInt(row.total_trades)) * 100) : 0;
      const profitFactor = parseFloat(row.gross_loss) > 0
        ? (parseFloat(row.gross_profit) / parseFloat(row.gross_loss)).toFixed(2)
        : parseFloat(row.gross_profit) > 0 ? '∞' : '0';

      let sharpeRatio = null;
      if (dailyPnls.length > 1) {
        const mean = dailyPnls.reduce((s, v) => s + v, 0) / dailyPnls.length;
        const variance = dailyPnls.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (dailyPnls.length - 1);
        const stddev = Math.sqrt(variance);
        sharpeRatio = stddev > 0 ? parseFloat((mean / stddev * Math.sqrt(dailyPnls.length)).toFixed(2)) : null;
      }

      let recoveryFactor = null;
      if (dailyPnls.length > 0) {
        let cumulative = 0, peak = 0, maxDD = 0;
        for (const pnl of dailyPnls) {
          cumulative += pnl; if (cumulative > peak) peak = cumulative;
          const dd = peak - cumulative; if (dd > maxDD) maxDD = dd;
        }
        const totalPnl = parseFloat(row.total_pnl);
        recoveryFactor = maxDD > 0 ? parseFloat((totalPnl / maxDD).toFixed(2)) : null;
      }

      return { ...row, sparkline, winRateTrades, profitFactor, sharpeRatio, recoveryFactor };
    }));

    res.json(months);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
