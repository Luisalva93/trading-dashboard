import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const MONTHS_ES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const BASE = process.env.REACT_APP_API_URL || '';

function Sparkline({ data, positive }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = 40, pad = 4;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return x + ',' + y;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={positive ? 'var(--green)' : 'var(--red)'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '1rem', color: val >= 0 ? 'var(--green)' : 'var(--red)' }}>
        {val >= 0 ? '+' : ''}${val.toFixed(0)}
      </div>
    </div>
  );
};

function MetricChip({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '0.82rem', color: color || 'var(--text)', marginTop: '2px' }}>{value}</div>
    </div>
  );
}

export default function History({ onSelectMonth }) {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGlobalChart, setShowGlobalChart] = useState(false);

  useEffect(() => {
    fetch(BASE + '/api/history')
      .then(r => r.json())
      .then(data => { setMonths(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalAllTime = months.reduce((s, m) => s + parseFloat(m.total_pnl), 0);
  const totalMonths = months.length;
  const profitableMonths = months.filter(m => parseFloat(m.total_pnl) > 0).length;

  const globalChartData = [...months].reverse();
  let cum = 0;
  const globalChartWithCumulative = globalChartData.map(m => {
    cum += parseFloat(m.total_pnl);
    return {
      label: MONTHS_ES[m.month].slice(0, 3) + ' ' + String(m.year).slice(2),
      acumulado: parseFloat(cum.toFixed(2)),
    };
  });
  const isGlobalPositive = totalAllTime >= 0;

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>Cargando historial...</div>;
  if (months.length === 0) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>
      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
      <div>Aún no hay historial. Registra trades para verlos aquí.</div>
    </div>
  );

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: 'P&L Total', value: (totalAllTime >= 0 ? '+' : '') + '$' + totalAllTime.toFixed(0), color: totalAllTime >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Meses Operados', value: totalMonths, color: 'var(--text)' },
          { label: 'Meses Rentables', value: profitableMonths + '/' + totalMonths, color: profitableMonths >= totalMonths/2 ? 'var(--green)' : 'var(--red)' },
          { label: 'Promedio Mensual', value: ((totalAllTime/totalMonths) >= 0 ? '+' : '') + '$' + (totalAllTime/totalMonths).toFixed(0), color: (totalAllTime/totalMonths) >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.2rem', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Global chart toggle */}
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => setShowGlobalChart(!showGlobalChart)} style={{
          padding: '9px 18px', borderRadius: '8px', cursor: 'pointer',
          border: '1px solid ' + (showGlobalChart ? 'var(--accent)' : 'var(--border)'),
          background: showGlobalChart ? 'var(--accent-glow)' : 'var(--surface)',
          color: showGlobalChart ? 'var(--accent)' : 'var(--text-muted)',
          fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
        }}>
          <span>{showGlobalChart ? '▼' : '▶'}</span>
          📈 Curva global de todos los meses
        </button>
      </div>

      {showGlobalChart && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '16px' }}>P&L Acumulado — Todos los meses</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={globalChartWithCumulative} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="globalGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c87a" stopOpacity={0.25} /><stop offset="95%" stopColor="#00c87a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="globalRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e84040" stopOpacity={0.25} /><stop offset="95%" stopColor="#e84040" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="acumulado"
                stroke={isGlobalPositive ? '#00c87a' : '#e84040'} strokeWidth={2}
                fill={isGlobalPositive ? 'url(#globalGreen)' : 'url(#globalRed)'}
                dot={{ fill: isGlobalPositive ? '#00c87a' : '#e84040', r: 4 }}
                activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Month cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
        {months.map((m, i) => {
          const pnl = parseFloat(m.total_pnl);
          const positive = pnl >= 0;
          const pf = parseFloat(m.profitFactor);
          const sharpe = m.sharpeRatio;
          const recovery = m.recoveryFactor;
          const sharpeColor = !sharpe ? 'var(--text)' : sharpe >= 1 ? 'var(--green)' : sharpe >= 0 ? '#f59e0b' : 'var(--red)';
          const recoveryColor = !recovery ? 'var(--text)' : recovery >= 2 ? 'var(--green)' : recovery >= 1 ? '#f59e0b' : 'var(--red)';

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

              {/* Row 1: Win, PF, Mejor, Peor */}
              <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
                <MetricChip label="Win %" value={m.winRateTrades + '%'} color={m.winRateTrades >= 50 ? 'var(--green)' : 'var(--red)'} />
                <MetricChip label="Profit F." value={isNaN(pf) ? m.profitFactor : pf.toFixed(2)} color={pf >= 1.5 ? 'var(--green)' : pf >= 1 ? '#f59e0b' : 'var(--red)'} />
                <MetricChip label="Mejor" value={'+$' + parseFloat(m.best_trade).toFixed(0)} color="var(--green)" />
                <MetricChip label="Peor" value={'$' + parseFloat(m.worst_trade).toFixed(0)} color="var(--red)" />
              </div>

              {/* Row 2: Sharpe, Recovery */}
              <div style={{ display: 'flex', gap: '14px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <MetricChip label="Sharpe" value={sharpe !== null && sharpe !== undefined ? sharpe : '—'} color={sharpeColor} />
                <MetricChip label="Recovery F." value={recovery !== null && recovery !== undefined ? recovery : '—'} color={recoveryColor} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
