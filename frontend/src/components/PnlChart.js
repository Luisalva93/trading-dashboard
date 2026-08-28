import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.1rem', color: val >= 0 ? 'var(--green)' : 'var(--red)' }}>
        {val >= 0 ? '+' : ''}${val.toFixed(0)}
      </div>
    </div>
  );
};

export default function PnlChart({ trades }) {
  if (!trades || trades.length === 0) return null;
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumulative = 0;
  const data = sorted.map(t => {
    const dateStr = typeof t.date === 'string' ? t.date : new Date(t.date).toISOString();
    const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    cumulative += parseFloat(t.pnl);
    return { label, acumulado: parseFloat(cumulative.toFixed(2)) };
  });
  const isPositive = cumulative >= 0;
  const strokeColor = isPositive ? '#00d97e' : '#ff4560';

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 20px 14px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)' }}>P&L Acumulado</div>
        <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.1rem', color: isPositive ? 'var(--green)' : 'var(--red)' }}>{isPositive ? '+' : ''}${cumulative.toFixed(0)}</div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="acumulado" stroke={strokeColor} strokeWidth={2.5} fill="url(#chartGrad)" dot={false} activeDot={{ r: 5, fill: strokeColor, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
