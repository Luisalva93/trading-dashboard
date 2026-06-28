import React from 'react';

export default function StatsBar({ trades }) {
  if (!trades || trades.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '18px 20px', marginBottom: '20px',
        color: 'var(--text-muted)', fontSize: '0.9rem',
      }}>
        Sin datos este mes. Haz clic en un día para registrar un trade.
      </div>
    );
  }

  const totalPnl = trades.reduce((sum, t) => sum + parseFloat(t.pnl), 0);
  const winDays = trades.filter(t => parseFloat(t.pnl) > 0).length;
  const lossDays = trades.filter(t => parseFloat(t.pnl) < 0).length;
  const winRate = trades.length > 0 ? Math.round((winDays / trades.length) * 100) : 0;
  const bestDay = trades.reduce((max, t) => parseFloat(t.pnl) > parseFloat(max.pnl) ? t : max, trades[0]);
  const worstDay = trades.reduce((min, t) => parseFloat(t.pnl) < parseFloat(min.pnl) ? t : min, trades[0]);
  const totalTrades = trades.reduce((sum, t) => sum + t.num_trades, 0);
  const pnlColor = totalPnl >= 0 ? 'var(--green)' : 'var(--red)';

  const stats = [
    { label: 'P&L del Mes', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, color: pnlColor },
    { label: 'Días Traded', value: trades.length, color: 'var(--text)' },
    { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'var(--green)' : 'var(--red)' },
    { label: 'Días W/L', value: `${winDays}W / ${lossDays}L`, color: 'var(--text)', split: true, win: winDays, loss: lossDays },
    { label: 'Mejor Día', value: `+$${parseFloat(bestDay.pnl).toFixed(0)}`, color: 'var(--green)' },
    { label: 'Peor Día', value: `$${parseFloat(worstDay.pnl).toFixed(0)}`, color: 'var(--red)' },
    { label: 'Total Trades', value: totalTrades, color: 'var(--text)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: '8px', marginBottom: '20px',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '14px 16px',
        }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px',
          }}>{s.label}</div>
          {s.split ? (
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1rem' }}>
              <span style={{ color: 'var(--green)' }}>{s.win}W</span>
              <span style={{ color: 'var(--text-muted)', margin: '0 3px', fontSize: '0.85rem' }}>/</span>
              <span style={{ color: 'var(--red)' }}>{s.loss}L</span>
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--mono)', fontWeight: 700,
              fontSize: 'clamp(0.9rem, 2vw, 1.15rem)', color: s.color,
            }}>{s.value}</div>
          )}
        </div>
      ))}
    </div>
  );
}
