import React, { useState, useEffect } from 'react';

export default function MonthlyGoal({ currentPnl, year, month }) {
  const storageKey = `goal_${year}_${month}`;
  const [goal, setGoal] = useState(() => {
    try { return parseFloat(localStorage.getItem('trading_monthly_goal') || '0'); } catch { return 0; }
  });
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');

  const saveGoal = () => {
    const val = parseFloat(input);
    if (!isNaN(val) && val > 0) {
      setGoal(val);
      try { localStorage.setItem('trading_monthly_goal', val); } catch {}
    }
    setEditing(false);
  };

  if (goal === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1 }}>🎯 Define tu meta mensual para ver tu progreso</div>
        {editing ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="number" autoFocus placeholder="ej: 2000" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveGoal()}
              style={{ width: '100px', background: 'var(--surface2)', border: '1px solid var(--accent)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.9rem', outline: 'none' }} />
            <button onClick={saveGoal} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Guardar</button>
            <button onClick={() => setEditing(false)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
          </div>
        ) : (
          <button onClick={() => { setEditing(true); setInput(''); }} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>+ Agregar meta</button>
        )}
      </div>
    );
  }

  const pct = Math.min(Math.max((currentPnl / goal) * 100, 0), 100);
  const reached = currentPnl >= goal;
  const remaining = goal - currentPnl;
  const barColor = reached ? 'var(--green)' : pct >= 70 ? '#f59e0b' : pct >= 40 ? 'var(--accent)' : 'var(--accent)';

  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${reached ? 'var(--green-border)' : 'var(--border)'}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>🎯 Meta del mes</span>
          {reached && <span style={{ fontSize: '0.7rem', background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: 'var(--green)', borderRadius: '20px', padding: '2px 8px', fontWeight: 600 }}>¡Alcanzada!</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ color: currentPnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>${currentPnl.toFixed(0)}</span>
            <span style={{ margin: '0 4px' }}>/</span>
            <span>${goal.toFixed(0)}</span>
          </div>
          {editing ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input type="number" autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveGoal()}
                style={{ width: '80px', background: 'var(--surface2)', border: '1px solid var(--accent)', borderRadius: '6px', padding: '4px 8px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.85rem', outline: 'none' }} />
              <button onClick={saveGoal} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>✓</button>
              <button onClick={() => setEditing(false)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => { setEditing(true); setInput(goal.toString()); }}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>✏️</button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '8px', background: 'var(--surface2)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct.toFixed(0)}% completado</div>
        <div style={{ fontSize: '0.72rem', color: reached ? 'var(--green)' : 'var(--text-muted)' }}>
          {reached ? `+$${(currentPnl - goal).toFixed(0)} sobre la meta` : `Faltan $${remaining.toFixed(0)}`}
        </div>
      </div>
    </div>
  );
}
