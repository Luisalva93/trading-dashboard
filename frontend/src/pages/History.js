import React, { useState, useEffect } from 'react';

const MONTHS_ES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const BASE = process.env.REACT_APP_API_URL || '';

function Sparkline({ data, positive }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = 40, pad = 4;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return x + ',' + y;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none"
        stroke={positive ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function History({ onSelectMonth }) {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(BASE + '/api/history')
      .then(r => r.json())
      .then(data => { setMonths(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalAllTime = months.reduce((s, m) => s + parseFloat(m.total_pnl), 0);
  const totalMonths = months.length;
  const profitableMonths = months.filter(m => parseFloat(m.total_pnl) > 0).length;

  if (loading) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>Cargando historial...</div>
  );

  if (months.length === 0) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>
      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
      <div>Aún no hay historial. Registra trades para verlos aquí.</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '28px' }}>
        {[
          { label: 'P&L Total', value: (totalAllTime >= 0 ? '+' : '') + '$' + totalAllTime.toFixed(0), color: totalAllTime >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Meses Operados', value: totalMonths, color: 'var(--text)' },
          { label: 'Meses Rentables', value: profitableMonths + '/' + totalMonths, color: 'var(--green)' },
          { label: 'Promedio Mensual', value: ((totalAllTime/totalMonths) >= 0 ? '+' : '') + '$' + (totalAllTime/totalMonths).toFixed(0), color: (totalAllTime/totalMonths) >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.2rem', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {months.map((m, i) => {
          const pnl = parseFloat(m.total_pnl);
          const positive = pnl >= 0;
          const pf = parseFloat(m.profitFactor);
          return (
            <div key={i} onClick={() => onSelectMonth(m.year, m.month)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              style={{ background: 'var(--surface)', border: '1px solid ' + (positive ? 'var(--green-border)' : 'var(--red-border)'), borderRadius: '14px', padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{MONTHS_ES[m.month]} {m.year}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.traded_days} días · {m.total_trades} trades</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.3rem', color: positive ? 'var(--green)' : 'var(--red)' }}>
                  {positive ? '+' : ''}${Math.abs(pnl).toFixed(0)}
                </div>
              </div>
              <Sparkline data={m.sparkline} positive={positive} />
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                {[
                  { label: 'Win %', value: m.winRateTrades + '%' },
                  { label: 'Profit F.', value: isNaN(pf) ? m.profitFactor : pf.toFixed(2) },
                  { label: 'Mejor', value: '+$' + parseFloat(m.best_trade).toFixed(0) },
                  { label: 'Peor', value: '$' + parseFloat(m.worst_trade).toFixed(0) },
                ].map((s, j) => (
                  <div key={j}>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', marginTop: '2px' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
