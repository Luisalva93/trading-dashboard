import React from 'react';

export default function StatsBar({ trades, stats }) {
  const totalPnl = trades.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const tradedDays = trades.length;

  const profitFactor = stats && parseFloat(stats.gross_loss) > 0
    ? (parseFloat(stats.gross_profit) / parseFloat(stats.gross_loss)).toFixed(2)
    : stats && parseFloat(stats.gross_profit) > 0 ? '∞' : '0.00';

  const tradeWinPct = stats && parseInt(stats.total_trades) > 0
    ? Math.round((parseInt(stats.winning_trades) / parseInt(stats.total_trades)) * 100)
    : 0;

  const avgWin = stats && parseFloat(stats.avg_win) ? parseFloat(stats.avg_win).toFixed(0) : '0';
  const avgLoss = stats && parseFloat(stats.avg_loss) ? Math.abs(parseFloat(stats.avg_loss)).toFixed(0) : '0';
  const totalTrades = stats ? parseInt(stats.total_trades) : 0;

  const pnlColor = totalPnl >= 0 ? 'var(--green)' : 'var(--red)';
  const pfColor = parseFloat(profitFactor) >= 1 ? 'var(--green)' : parseFloat(profitFactor) === 0 ? 'var(--text)' : 'var(--red)';
  const winColor = tradeWinPct >= 50 ? 'var(--green)' : tradeWinPct === 0 ? 'var(--text)' : 'var(--red)';

  const items = [
    { label: 'P&L del Mes', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, color: pnlColor },
    { label: 'Días Traded', value: tradedDays, color: 'var(--text)' },
    { label: 'Profit Factor', value: profitFactor, color: pfColor },
    { label: 'Trade Win %', value: `${tradeWinPct}%`, color: winColor },
    { label: 'Avg Win', value: `+$${avgWin}`, color: 'var(--green)' },
    { label: 'Avg Loss', value: `-$${avgLoss}`, color: 'var(--red)' },
    { label: 'Total Trades', value: totalTrades, color: 'var(--text)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
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
          <div style={{
            fontFamily: 'var(--mono)', fontWeight: 700,
            fontSize: 'clamp(0.9rem, 2vw, 1.15rem)', color: s.color,
          }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
