import React, { useState, useEffect } from 'react';

export default function TradeModal({ date, existing, onSave, onDelete, onClose }) {
  const [pnl, setPnl] = useState('');
  const [numTrades, setNumTrades] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existing) {
      setPnl(existing.pnl);
      setNumTrades(existing.num_trades);
      setNotes(existing.notes || '');
    }
  }, [existing]);

  const handleSave = () => {
    if (pnl === '') return;
    onSave({ date, pnl: parseFloat(pnl), num_trades: parseInt(numTrades) || 0, notes });
  };

  const [y, m, d] = date.split('-').map(Number);
  const formatted = new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
        // On desktop center it
        '@media (min-width: 640px)': { alignItems: 'center' },
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px 36px',
        width: '100%', maxWidth: '480px',
        // Desktop: rounded all corners
        boxShadow: '0 -4px 40px rgba(0,0,0,0.5)',
      }}>
        {/* Drag handle */}
        <div style={{
          width: '40px', height: '4px', background: 'var(--border)',
          borderRadius: '2px', margin: '0 auto 20px',
        }} />

        <div style={{
          fontWeight: 600, fontSize: '1rem', color: 'var(--text)',
          marginBottom: '4px', textTransform: 'capitalize',
        }}>
          {existing ? 'Editar día' : 'Registrar día'}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          {formatted}
        </div>

        {/* P&L + Trades row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--text-muted)', marginBottom: '8px',
            }}>P&L ($)</label>
            <input
              type="number" step="0.01" placeholder="0.00"
              value={pnl}
              onChange={e => setPnl(e.target.value)}
              autoFocus
              style={{
                width: '100%', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: '10px',
                padding: '14px', color: 'var(--text)',
                fontFamily: 'var(--mono)', fontSize: '1.1rem', outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--text-muted)', marginBottom: '8px',
            }}>Trades</label>
            <input
              type="number" min="0" placeholder="0"
              value={numTrades}
              onChange={e => setNumTrades(e.target.value)}
              style={{
                width: '100%', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: '10px',
                padding: '14px', color: 'var(--text)',
                fontFamily: 'var(--mono)', fontSize: '1.1rem', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block', fontSize: '0.72rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--text-muted)', marginBottom: '8px',
          }}>Notas del día</label>
          <textarea
            placeholder="¿Cómo fue la sesión? Setup, emociones, errores..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{
              width: '100%', background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: '10px',
              padding: '14px', color: 'var(--text)',
              fontFamily: 'var(--sans)', fontSize: '0.95rem', outline: 'none',
              resize: 'none', minHeight: '90px', lineHeight: 1.5,
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {existing && (
            <button
              onClick={() => onDelete(date)}
              style={{
                padding: '14px 18px', borderRadius: '10px',
                border: '1px solid var(--red-border)', background: 'transparent',
                color: 'var(--red)', cursor: 'pointer',
                fontFamily: 'var(--sans)', fontSize: '0.9rem',
              }}
            >Eliminar</button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '14px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: '0.95rem',
            }}
          >Cancelar</button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: '14px', borderRadius: '10px',
              border: 'none', background: 'var(--accent)',
              color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: '0.95rem', fontWeight: 600,
            }}
          >Guardar</button>
        </div>
      </div>
    </div>
  );
}
