import React from 'react';

function StatCard({ label, value, color, tooltip }) {
  return (
    <div title={tooltip || ''} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', cursor: tooltip ? 'help' : 'default' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: color || 'var(--text)' }}>{value}</div>
    </div>
  );
}

export default function StatsBar({ trades, stats }) {
  const totalPnl = trades.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const tradedDays = trades.length;
  const winDays = trades.filter(t => parseFloat(t.pnl) > 0).length;
  const lossDays = trades.filter(t => parseFloat(t.pnl) < 0).length;
  const winRateDays = tradedDays > 0 ? Math.round((winDays / tradedDays) * 100) : 0;
  const bestDay = tradedDays > 0 ? trades.reduce((max, t) => parseFloat(t.pnl) > parseFloat(max.pnl) ? t : max, trades[0]) : null;
  const worstDay = tradedDays > 0 ? trades.reduce((min, t) => parseFloat(t.pnl) < parseFloat(min.pnl) ? t : min, trades[0]) : null;

  const profitFactor = stats && parseFloat(stats.gross_loss) > 0
    ? (parseFloat(stats.gross_profit) / parseFloat(stats.gross_loss)).toFixed(2)
    : stats && parseFloat(stats.gross_profit) > 0 ? '∞' : '—';
  const tradeWinPct = stats && parseInt(stats.total_trades) > 0
    ? Math.round((parseInt(stats.winning_trades) / parseInt(stats.total_trades)) * 100) : 0;
  const avgWin = stats && parseFloat(stats.avg_win) ? parseFloat(stats.avg_win).toFixed(0) : '0';
  const avgLoss = stats && parseFloat(stats.avg_loss) ? Math.abs(parseFloat(stats.avg_loss)).toFixed(0) : '0';
  const totalTrades = stats ? parseInt(stats.total_trades) : 0;
  const sharpe = stats?.sharpe_ratio;
  const recovery = stats?.recovery_factor;
  const maxDD = stats?.max_drawdown;
  const pfVal = parseFloat(profitFactor);

  const sharpeColor = !sharpe ? 'var(--text-muted)' : sharpe >= 1 ? 'var(--green)' : sharpe >= 0 ? '#f59e0b' : 'var(--red)';
  const recoveryColor = !recovery ? 'var(--text-muted)' : recovery >= 2 ? 'var(--green)' : recovery >= 1 ? '#f59e0b' : 'var(--red)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '20px' }}>
      <StatCard label="P&L del Mes" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`} color={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} />
      <StatCard label="Días Traded" value={tradedDays} />
      <StatCard label="Win Rate Días" value={`${winRateDays}%`} color={winRateDays >= 50 ? 'var(--green)' : 'var(--red)'} />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>Días +/-</div>
        <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>
          <span style={{ color: 'var(--green)' }}>{winDays}W</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 3px', fontSize: '0.85rem' }}>/</span>
          <span style={{ color: 'var(--red)' }}>{lossDays}L</span>
        </div>
      </div>
      <StatCard label="Mejor Día" value={bestDay ? `+$${parseFloat(bestDay.pnl).toFixed(0)}` : '—'} color="var(--green)" />
      <StatCard label="Peor Día" value={worstDay ? `$${parseFloat(worstDay.pnl).toFixed(0)}` : '—'} color="var(--red)" />
      <StatCard label="Profit Factor" value={profitFactor} color={pfVal >= 1.5 ? 'var(--green)' : pfVal >= 1 ? '#f59e0b' : 'var(--red)'} tooltip="Suma ganancias / suma pérdidas. > 1.5 bueno, > 2 excelente" />
      <StatCard label="Trade Win %" value={`${tradeWinPct}%`} color={tradeWinPct >= 50 ? 'var(--green)' : 'var(--red)'} />
      <StatCard label="Avg Win" value={`+$${avgWin}`} color="var(--green)" />
      <StatCard label="Avg Loss" value={`-$${avgLoss}`} color="var(--red)" />
      <StatCard label="Total Trades" value={totalTrades} />
      <StatCard label="Sharpe Ratio" value={sharpe !== null && sharpe !== undefined ? sharpe : '—'} color={sharpeColor} tooltip="Rentabilidad ajustada al riesgo. > 1 bueno, > 2 excelente" />
      <StatCard label="Recovery Factor" value={recovery !== null && recovery !== undefined ? recovery : '—'} color={recoveryColor} tooltip="P&L total / max drawdown. > 2 significa que ganas el doble de tu peor caída" />
      {maxDD > 0 && <StatCard label="Max Drawdown" value={`-$${parseFloat(maxDD).toFixed(0)}`} color="var(--red)" tooltip="Caída máxima desde un pico hasta un valle en el mes" />}
    </div>
  );
}
