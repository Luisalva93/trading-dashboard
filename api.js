import React from 'react';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const s = {
  wrapper: { userSelect: 'none' },
  header: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px', marginBottom: '4px',
  },
  dayHeader: {
    textAlign: 'center', fontSize: '0.7rem', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: 'var(--text-muted)', padding: '8px 0',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' },
  cell: (hasData, pnl, isToday) => ({
    minHeight: '90px', borderRadius: '10px', padding: '10px',
    border: `1px solid ${
      isToday ? 'var(--accent)' :
      hasData && pnl > 0 ? 'var(--green-border)' :
      hasData && pnl < 0 ? 'var(--red-border)' :
      'var(--border)'
    }`,
    background: hasData && pnl > 0 ? 'var(--green-bg)' :
                hasData && pnl < 0 ? 'var(--red-bg)' :
                'var(--surface)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.1s',
    position: 'relative',
  }),
  emptyCell: {
    minHeight: '90px', borderRadius: '10px',
    background: 'transparent', opacity: 0.2,
  },
  dateNum: (hasData, pnl) => ({
    fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)',
    marginBottom: '6px',
  }),
  pnl: (pnl) => ({
    fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1rem',
    color: pnl > 0 ? 'var(--green)' : 'var(--red)',
    lineHeight: 1.2,
  }),
  meta: {
    fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4,
  },
  todayDot: {
    position: 'absolute', top: '8px', right: '8px',
    width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)',
  },
};

export default function Calendar({ year, month, trades, onDayClick }) {
  const tradeMap = {};
  trades.forEach(t => { tradeMap[t.date.slice(0, 10)] = t; });

  const today = new Date();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        {DAYS.map(d => <div key={d} style={s.dayHeader}>{d}</div>)}
      </div>
      <div style={s.grid}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} style={s.emptyCell} />;

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const trade = tradeMap[dateStr];
          const pnl = trade ? parseFloat(trade.pnl) : null;
          const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;

          return (
            <div
              key={dateStr}
              style={s.cell(!!trade, pnl, isToday)}
              onClick={() => onDayClick(dateStr, trade)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isToday && <div style={s.todayDot} />}
              <div style={s.dateNum(!!trade, pnl)}>{day}</div>
              {trade && (
                <>
                  <div style={s.pnl(pnl)}>
                    {pnl > 0 ? '+' : ''}${Math.abs(pnl).toFixed(0)}
                  </div>
                  <div style={s.meta}>
                    {trade.num_trades} trade{trade.num_trades !== 1 ? 's' : ''}
                    {trade.notes && <> · 📝</>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
