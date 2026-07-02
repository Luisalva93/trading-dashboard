import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '10px 14px',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{
        fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '1rem',
        color: val >= 0 ? 'var(--green)' : 'var(--red)',
      }}>
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
    cumulative += parseFloat(t.pnl);
    // Fix: parse date parts manually to avoid timezone issues
    const dateStr2 = typeof t.date === 'string' ? t.date : new Date(t.date).toISOString(); const [y, m, d] = dateStr2.slice(0, 10).split('-').map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short'
    });
    return {
      label,
      pnl: parseFloat(t.pnl),
      acumulado: parseFloat(cumulative.toFixed(2)),
    };
  });

  const isPositive = cumulative >= 0;
  const gradientId = isPositive ? 'greenGrad' : 'redGrad';
  const strokeColor = isPositive ? '#00c87a' : '#e84040';

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '20px 16px', marginBottom: '24px',
    }}>
      <div style={{
        fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '16px',
      }}>
        P&L Acumulado
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00c87a" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00c87a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e84040" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#e84040" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--mono)' }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `$${v}`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
          <Area
            type="monotone" dataKey="acumulado"
            stroke={strokeColor} strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false} activeDot={{ r: 4, fill: strokeColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
