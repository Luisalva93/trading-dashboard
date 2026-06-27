import React, { useState, useEffect } from 'react';

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '28px', width: '420px', maxWidth: '90vw',
  },
  title: {
    fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '1.1rem',
    color: 'var(--text)', marginBottom: '20px',
  },
  label: {
    display: 'block', fontSize: '0.75rem', fontWeight: 500,
    color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: '6px',
  },
  input: {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '10px 14px', color: 'var(--text)',
    fontFamily: 'var(--mono)', fontSize: '0.95rem', outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '10px 14px', color: 'var(--text)',
    fontFamily: 'var(--sans)', fontSize: '0.9rem', outline: 'none',
    resize: 'vertical', minHeight: '80px',
  },
  fieldGroup: { marginBottom: '16px' },
  row: { display: 'flex', gap: '12px' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' },
  btnCancel: {
    padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
    fontFamily: 'var(--sans)', fontSize: '0.9rem',
  },
  btnSave: {
    padding: '9px 20px', borderRadius: '8px', border: 'none',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer',
    fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 600,
  },
  btnDelete: {
    padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--red-border)',
    background: 'transparent', color: 'var(--red)', cursor: 'pointer',
    fontFamily: 'var(--sans)', fontSize: '0.9rem', marginRight: 'auto',
  },
};

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

  const formatted = new Date(date + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.title}>
          {existing ? 'Editar día' : 'Registrar día'} — {formatted}
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>P&L ($)</label>
            <input
              style={styles.input}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={pnl}
              onChange={e => setPnl(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Trades</label>
            <input
              style={styles.input}
              type="number"
              min="0"
              placeholder="0"
              value={numTrades}
              onChange={e => setNumTrades(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Notas del día</label>
          <textarea
            style={styles.textarea}
            placeholder="¿Cómo fue la sesión? Setup, emociones, errores..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div style={styles.btnRow}>
          {existing && (
            <button style={styles.btnDelete} onClick={() => onDelete(date)}>Eliminar</button>
          )}
          <button style={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button style={styles.btnSave} onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
