import React from 'react';

const SESSIONS = [
  { id: 'NY', label: 'New York', flag: '🗽' },
  { id: 'LDN', label: 'London', flag: '🇬🇧' },
  { id: 'ASIA', label: 'Asia', flag: '🌏' },
];

export default function SessionSelector({ session, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px' }}>
      {SESSIONS.map(s => (
        <button key={s.id} onClick={() => onChange(s.id)}
          style={{
            padding: '8px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            background: session === s.id ? 'var(--accent)' : 'transparent',
            color: session === s.id ? '#fff' : 'var(--text-muted)',
            fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: session === s.id ? 700 : 400,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px',
            boxShadow: session === s.id ? '0 2px 12px rgba(91,124,250,0.3)' : 'none',
          }}>
          <span>{s.flag}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
