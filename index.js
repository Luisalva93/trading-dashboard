import React from 'react';

const s = {
  bar: {
    display: 'flex', gap: '16px', flexWrap: 'wrap',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '18px 24px', marginBottom: '24px',
  },
  stat: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' },
  label: {
    fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: 'var(--text-muted)',
  },
  value: { fontFamily: 'var(--mono)', fontSize: '1.2rem', fontWeight: 600 },
  divider: { width: '1px', background: 'var(--border)', margin: '0 4px' },
};

export default function StatsBar({ trades }) {
  if (!trades || trades.length === 0) {
    return (
      <div style={s.bar}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Sin datos este mes. Haz clic en un día para registrar un trade.
        </span>
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

  return (
    <div style={s.bar}>
      <div style={s.stat}>
        <span style={s.label}>P&L del Mes</span>
        <span style={{ ...s.value, color: pnlColor }}>
          {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
        </span>
      </div>
      <div style={s.divider} />
      <div style={s.stat}>
        <span style={s.label}>Días Traded</span>
        <span style={s.value}>{trades.length}</span>
      </div>
      <div style={s.divider} />
      <div style={s.stat}>
        <span style={s.label}>Win Rate</span>
        <span style={{ ...s.value, color: winRate >= 50 ? 'var(--green)' : 'var(--red)' }}>
          {winRate}%
        </span>
      </div>
      <div style={s.divider} />
      <div style={s.stat}>
        <span style={s.label}>Días +/-</span>
        <span style={s.value}>
          <span style={{ color: 'var(--green)' }}>{winDays}W</span>
          {' '}<span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/</span>{' '}
          <span style={{ color: 'var(--red)' }}>{lossDays}L</span>
        </span>
      </div>
      <div style={s.divider} />
      <div style={s.stat}>
        <span style={s.label}>Mejor Día</span>
        <span style={{ ...s.value, color: 'var(--green)' }}>
          +${parseFloat(bestDay.pnl).toFixed(0)}
        </span>
      </div>
      <div style={s.divider} />
      <div style={s.stat}>
        <span style={s.label}>Peor Día</span>
        <span style={{ ...s.value, color: 'var(--red)' }}>
          ${parseFloat(worstDay.pnl).toFixed(0)}
        </span>
      </div>
      <div style={s.divider} />
      <div style={s.stat}>
        <span style={s.label}>Total Trades</span>
        <span style={s.value}>{totalTrades}</span>
      </div>
    </div>
  );
}
