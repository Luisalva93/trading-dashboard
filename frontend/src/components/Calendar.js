import React, { useState } from 'react';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Semana'];

export default function Calendar({ year, month, trades, onDayClick }) {
  const [tooltip, setTooltip] = useState(null);

  const tradeMap = {};
  trades.forEach(t => { const d = typeof t.date === 'string' ? t.date : new Date(t.date).toISOString(); tradeMap[d.slice(0, 10)] = t; });

  const today = new Date();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // Build weeks: each week is [Mon, Tue, Wed, Thu, Fri]
  const weeks = [];
  let week = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay(); // 0=Sun,1=Mon...6=Sat
    if (dow === 0 || dow === 6) continue; // skip weekends

    // Start a new week on Monday
    if (dow === 1 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    week.push(d);
  }
  if (week.length > 0) weeks.push(week);

  const dateStr = (d) =>
    `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  return (
    <div style={{ userSelect: 'none', overflowX: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 140px',
        gap: '4px', marginBottom: '4px',
      }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '0.7rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--text-muted)', padding: '8px 0',
          }}>{d}</div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((weekDays, wi) => {
        // Pad to 5 days
        const padded = Array(5).fill(null);
        weekDays.forEach(d => {
          const dow = new Date(year, month - 1, d).getDay();
          const idx = dow - 1; // Mon=0...Fri=4
          padded[idx] = d;
        });

        // Weekly summary
        const weekTrades = padded
          .filter(Boolean)
          .map(d => tradeMap[dateStr(d)])
          .filter(Boolean);
        const weekPnl = weekTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
        const weekCount = weekTrades.reduce((s, t) => s + parseInt(t.num_trades || 0), 0);
        const weekWin = weekTrades.filter(t => parseFloat(t.pnl) > 0).length;
        const weekPositive = weekPnl > 0;

        return (
          <div key={wi} style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 140px',
            gap: '4px', marginBottom: '4px',
          }}>
            {/* Day cells */}
            {padded.map((day, di) => {
              if (!day) return (
                <div key={`empty-${wi}-${di}`} style={{
                  minHeight: '80px', borderRadius: '10px',
                  background: 'var(--surface)', opacity: 0.3,
                  border: '1px solid var(--border)',
                }} />
              );

              const ds = dateStr(day);
              const trade = tradeMap[ds];
              const pnl = trade ? parseFloat(trade.pnl) : null;
              const isToday = today.getFullYear() === year &&
                today.getMonth() + 1 === month && today.getDate() === day;

              return (
                <div
                  key={ds}
                  onClick={() => onDayClick(ds)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  style={{
                    minHeight: '80px', borderRadius: '10px', padding: '8px',
                    border: `1px solid ${
                      isToday ? 'var(--accent)' :
                      trade && pnl > 0 ? 'var(--green-border)' :
                      trade && pnl < 0 ? 'var(--red-border)' :
                      'var(--border)'
                    }`,
                    background: trade && pnl > 0 ? 'var(--green-bg)' :
                                trade && pnl < 0 ? 'var(--red-bg)' :
                                'var(--surface)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, transform 0.1s',
                    position: 'relative',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}
                >
                  {isToday && (
                    <div style={{
                      position: 'absolute', top: '6px', right: '6px',
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--accent)',
                    }} />
                  )}
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)',
                  }}>{day}</div>

                  {trade && (
                    <div>
                      <div style={{
                        fontFamily: 'var(--mono)', fontWeight: 700,
                        fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
                        color: pnl > 0 ? 'var(--green)' : 'var(--red)',
                        lineHeight: 1.2,
                      }}>
                        {pnl > 0 ? '+' : ''}${Math.abs(pnl).toFixed(0)}
                      </div>
                      <div style={{
                        fontSize: '0.65rem', color: 'var(--text-muted)',
                        marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        {trade.num_trades}t
                        {trade.notes && (
                          <span
                            style={{ cursor: 'help', position: 'relative' }}
                            onMouseEnter={e => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({ text: trade.notes, x: rect.left, y: rect.top });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >📝</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Weekly summary cell */}
            <div style={{
              minHeight: '80px', borderRadius: '10px', padding: '10px 12px',
              border: `1px solid ${weekTrades.length > 0
                ? (weekPositive ? 'var(--green-border)' : 'var(--red-border)')
                : 'var(--border)'}`,
              background: weekTrades.length > 0
                ? (weekPositive ? 'rgba(0,200,122,0.08)' : 'rgba(232,64,64,0.08)')
                : 'var(--surface2)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px',
            }}>
              <div style={{
                fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px',
              }}>Semana {wi + 1}</div>
              {weekTrades.length > 0 ? (
                <>
                  <div style={{
                    fontFamily: 'var(--mono)', fontWeight: 700,
                    fontSize: 'clamp(0.85rem, 1.5vw, 1.05rem)',
                    color: weekPositive ? 'var(--green)' : 'var(--red)',
                  }}>
                    {weekPositive ? '+' : ''}${Math.abs(weekPnl).toFixed(0)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {weekCount} trades
                  </div>
                  <div style={{ fontSize: '0.68rem', color: weekPositive ? 'var(--green)' : 'var(--red)' }}>
                    {weekWin}/{weekTrades.length} días ✓
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.5 }}>
                  Sin datos
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Notes tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y - 80,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '10px 14px', maxWidth: '220px',
          fontSize: '0.8rem', color: 'var(--text)', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', lineHeight: 1.5,
          pointerEvents: 'none',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
