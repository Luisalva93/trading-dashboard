import React from 'react';

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
    ? Math.round((parseInt(stats.winning_trades) / parseInt(stats.total_trades)) * 100)
    : 0;

  const avgWin = stats && parseFloat(stats.avg_win) ? parseFloat(stats.avg_win).toFixed(0) : '0';
  const avgLoss = stats && parseFloat(stats.avg_loss) ? Math.abs(parseFloat(stats.avg_loss)).toFixed(0) : '0';
  const totalTrades = stats ? parseInt(stats.total_trades) : 0;

  const pnlColor = totalPnl >= 0 ? 'var(--green)' : 'var(--red)';

  const items = [
    { label: 'P&L del Mes', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, color: pnlColor },
    { label: 'Días Traded', value: tradedDays, color: 'var(--text)' },
    { label: 'Win Rate Días', value: `${winRateDays}%`, color: winRateDays >= 50 ? 'var(--green)' : 'var(--red)' },
    {
      label: 'Días +/-',
      custom: (
        <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>
          <span style={{ color: 'var(--green)' }}>{winDays}W</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 3px', fontSize: '0.85rem' }}>/</span>
          <span style={{ color: 'var(--red)' }}>{lossDays}L</span>
        </div>
      )
    },
    { label: 'Mejor Día', value: bestDay ? `+$${parseFloat(bestDay.pnl).toFixed(0)}` : '—', color: 'var(--green)' },
    { label: 'Peor Día', value: worstDay ? `$${parseFloat(worstDay.pnl).toFixed(0)}` : '—', color: 'var(--red)' },
    { label: 'Profit Factor', value: profitFactor, color: parseFloat(profitFactor) >= 1 ? 'var(--green)' : 'var(--red)' },
    { label: 'Trade Win %', value: `${tradeWinPct}%`, color: tradeWinPct >= 50 ? 'var(--green)' : 'var(--red)' },
    { label: 'Avg Win', value: `+$${avgWin}`, color: 'var(--green)' },
    { label: 'Avg Loss', value: `-$${avgLoss}`, color: 'var(--red)' },
    { label: 'Total Trades', value: totalTrades, color: 'var(--text)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: '8px', marginBottom: '20px',
    }}>
      {items.map((s, i) => (
        <div key={i} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '14px 16px',
        }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px',
          }}>{s.label}</div>
          {s.custom || (
            <div style={{
              fontFamily: 'var(--mono)', fontWeight: 700,
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: s.color,
            }}>{s.value}</div>
          )}
        </div>
      ))}
    </div>
  );
}
