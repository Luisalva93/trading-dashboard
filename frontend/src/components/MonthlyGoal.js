import React, { useState } from 'react';

export default function MonthlyGoal({ currentPnl, session }) {
  const goalKey = `trading_monthly_goal_${session}`;
  const [goal, setGoal] = useState(() => {
    try { return parseFloat(localStorage.getItem(goalKey) || '0'); } catch { return 0; }
  });
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');

  const saveGoal = () => {
    const val = parseFloat(input);
    if (!isNaN(val) && val > 0) {
      setGoal(val);
      try { localStorage.setItem(goalKey, val); } catch {}
    }
    setEditing(false);
  };

  const sessionLabel = session === 'NY' ? '🗽 NY' : '🇬🇧 LDN';

  if (goal === 0) return (
    <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px', padding: '12px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>🎯 Meta mensual {sessionLabel} — sin definir</div>
      {editing ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="number" autoFocus placeholder="ej: 1000" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveGoal()}
            style={{ width: '110px', background: 'var(--surface2)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '7px 12px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.95rem', outline: 'none' }} />
          <button onClick={saveGoal} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
          <button onClick={() => setEditing(false)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <button onClick={() => { setEditing(true); setInput(''); }}
          style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'var(--accent-glow)', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
          + Agregar meta
        </button>
      )}
    </div>
  );

  const pct = Math.min(Math.max((currentPnl / goal) * 100, 0), 100);
  const reached = currentPnl >= goal;
  const barColor = reached ? 'var(--green)' : pct >= 70 ? '#f59e0b' : 'var(--accent)';

  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${reached ? 'var(--green-border)' : 'var(--border)'}`, borderRadius: '14px', padding: '14px 18px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>🎯 Meta {sessionLabel}</span>
          {reached && <span style={{ fontSize: '0.68rem', background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: 'var(--green)', borderRadius: '20px', padding: '2px 10px', fontWeight: 700 }}>¡Alcanzada!</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <span style={{ color: currentPnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>${currentPnl.toFixed(0)}</span>
            <span style={{ margin: '0 4px', opacity: 0.5 }}>/</span>
            <span>${goal.toFixed(0)}</span>
          </div>
          {editing ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input type="number" autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveGoal()}
                style={{ width: '80px', background: 'var(--surface2)', border: '1px solid var(--accent)', borderRadius: '6px', padding: '4px 8px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.85rem', outline: 'none' }} />
              <button onClick={saveGoal} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>✓</button>
              <button onClick={() => setEditing(false)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => { setEditing(true); setInput(goal.toString()); }} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>✏️</button>
          )}
        </div>
      </div>
      <div style={{ height: '7px', background: 'var(--surface2)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: barColor, borderRadius: '4px', transition: 'width 0.5s ease', boxShadow: reached ? '0 0 10px rgba(0,217,126,0.4)' : 'none' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pct.toFixed(0)}% completado</div>
        <div style={{ fontSize: '0.7rem', color: reached ? 'var(--green)' : 'var(--text-muted)' }}>
          {reached ? `+$${(currentPnl - goal).toFixed(0)} sobre la meta 🎉` : `Faltan $${(goal - currentPnl).toFixed(0)}`}
        </div>
      </div>
    </div>
  );
}
