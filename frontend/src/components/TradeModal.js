import React, { useState, useEffect } from 'react';
import { fetchDayTrades, addTrade, updateTrade, deleteTrade, saveNotes, deleteDay } from '../api';

const INSTRUMENTS = ['NQ', 'MNQ', 'ES', 'MES', 'YM', 'RTY'];
const SETUPS = ['ORB', 'Pullback', 'Reversión', 'Breakout', 'VWAP', 'Scalp', 'Otro'];

const inputStyle = {
  width: '100%', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: '10px',
  padding: '12px', color: 'var(--text)',
  fontFamily: 'var(--mono)', fontSize: '1rem', outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: '0.7rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: 'var(--text-muted)', marginBottom: '6px',
};

const selectStyle = {
  ...inputStyle, fontFamily: 'var(--sans)', cursor: 'pointer',
  appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  paddingRight: '32px',
};

function TradeRow({ trade, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [pnl, setPnl] = useState(trade.pnl);
  const [instrument, setInstrument] = useState(trade.instrument || 'NQ');
  const [setup, setSetup] = useState(trade.setup || '');
  const [entryTime, setEntryTime] = useState(trade.entry_time || '');

  const pnlVal = parseFloat(trade.pnl);

  if (editing) {
    return (
      <div style={{
        background: 'var(--surface2)', borderRadius: '10px',
        padding: '12px', marginBottom: '8px',
        border: '1px solid var(--accent)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={labelStyle}>P&L ($)</label>
            <input style={inputStyle} type="number" step="0.01" value={pnl} onChange={e => setPnl(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Hora</label>
            <input style={inputStyle} type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Instrumento</label>
            <select style={selectStyle} value={instrument} onChange={e => setInstrument(e.target.value)}>
              {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Setup</label>
            <select style={selectStyle} value={setup} onChange={e => setSetup(e.target.value)}>
              <option value="">— Ninguno —</option>
              {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onDelete(trade.id)} style={{
            padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--red-border)',
            background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem',
          }}>Eliminar</button>
          <button onClick={() => setEditing(false)} style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem',
          }}>Cancelar</button>
          <button onClick={() => { onUpdate(trade.id, { pnl: parseFloat(pnl), instrument, setup, entry_time: entryTime }); setEditing(false); }} style={{
            flex: 2, padding: '8px', borderRadius: '8px', border: 'none',
            background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
          }}>Guardar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface2)', borderRadius: '10px', padding: '12px 14px',
        marginBottom: '8px', cursor: 'pointer',
        border: `1px solid ${pnlVal > 0 ? 'var(--green-border)' : pnlVal < 0 ? 'var(--red-border)' : 'var(--border)'}`,
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: pnlVal > 0 ? 'var(--green)' : pnlVal < 0 ? 'var(--red)' : 'var(--text-muted)',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {trade.instrument || 'NQ'}{trade.setup ? ` · ${trade.setup}` : ''}{trade.entry_time ? ` · ${trade.entry_time}` : ''}
          </div>
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1rem',
        color: pnlVal > 0 ? 'var(--green)' : pnlVal < 0 ? 'var(--red)' : 'var(--text)',
      }}>
        {pnlVal > 0 ? '+' : ''}${Math.abs(pnlVal).toFixed(0)}
      </div>
    </div>
  );
}

export default function TradeModal({ date, onClose, onRefresh }) {
  const [dayData, setDayData] = useState({ trades: [], notes: '' });
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New trade form state
  const [newPnl, setNewPnl] = useState('');
  const [newInstrument, setNewInstrument] = useState('NQ');
  const [newSetup, setNewSetup] = useState('');
  const [newEntryTime, setNewEntryTime] = useState('');

  const [y, m, d] = date.split('-').map(Number);
  const formatted = new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDayTrades(date);
      setDayData(data);
      setNotes(data.notes || '');
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [date]);

  const totalPnl = dayData.trades.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const wins = dayData.trades.filter(t => parseFloat(t.pnl) > 0).length;

  const handleAddTrade = async () => {
    if (newPnl === '') return;
    await addTrade({ date, pnl: parseFloat(newPnl), instrument: newInstrument, setup: newSetup, entry_time: newEntryTime });
    setNewPnl(''); setNewSetup(''); setNewEntryTime('');
    setShowAddForm(false);
    await load();
    onRefresh();
  };

  const handleUpdate = async (id, data) => {
    await updateTrade(id, data);
    await load();
    onRefresh();
  };

  const handleDelete = async (id) => {
    await deleteTrade(id);
    await load();
    onRefresh();
  };

  const handleSaveNotes = async () => {
    await saveNotes(date, notes);
  };

  const handleDeleteDay = async () => {
    if (window.confirm('¿Eliminar todos los trades de este día?')) {
      await deleteDay(date);
      onClose();
      onRefresh();
    }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '20px 20px 0 0', padding: '20px 20px 32px',
        width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.5)',
      }}>
        {/* Drag handle */}
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto 16px' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)', textTransform: 'capitalize' }}>{formatted}</div>
            {dayData.trades.length > 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {dayData.trades.length} trades · {wins}W/{dayData.trades.length - wins}L ·{' '}
                <span style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
                </span>
              </div>
            )}
          </div>
          {dayData.trades.length > 0 && (
            <button onClick={handleDeleteDay} style={{
              padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--red-border)',
              background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '0.75rem',
            }}>Borrar día</button>
          )}
        </div>

        {/* Trade list */}
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>Cargando...</div>
        ) : (
          <>
            {dayData.trades.map(t => (
              <TradeRow key={t.id} trade={t} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}

            {/* Add trade form */}
            {showAddForm ? (
              <div style={{
                background: 'var(--surface2)', borderRadius: '12px',
                padding: '14px', marginBottom: '12px',
                border: '1px solid var(--accent)',
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
                  Nuevo trade
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={labelStyle}>P&L ($) *</label>
                    <input
                      style={inputStyle} type="number" step="0.01" placeholder="0.00"
                      value={newPnl} onChange={e => setNewPnl(e.target.value)} autoFocus
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Hora entrada</label>
                    <input style={inputStyle} type="time" value={newEntryTime} onChange={e => setNewEntryTime(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Instrumento</label>
                    <select style={selectStyle} value={newInstrument} onChange={e => setNewInstrument(e.target.value)}>
                      {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Setup</label>
                    <select style={selectStyle} value={newSetup} onChange={e => setNewSetup(e.target.value)}>
                      <option value="">— Ninguno —</option>
                      {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowAddForm(false)} style={{
                    flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem',
                  }}>Cancelar</button>
                  <button onClick={handleAddTrade} style={{
                    flex: 2, padding: '11px', borderRadius: '8px', border: 'none',
                    background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                  }}>Agregar Trade</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)} style={{
                width: '100%', padding: '13px', borderRadius: '10px',
                border: '1px dashed var(--border)', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem',
                marginBottom: '12px', transition: 'border-color 0.2s',
              }}>
                + Agregar trade
              </button>
            )}

            {/* Notes */}
            <div style={{ marginTop: '4px' }}>
              <label style={labelStyle}>Notas del día</label>
              <textarea
                placeholder="¿Cómo fue la sesión? Setup, emociones, errores..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                style={{
                  ...inputStyle, fontFamily: 'var(--sans)', fontSize: '0.9rem',
                  resize: 'none', minHeight: '80px', lineHeight: 1.5,
                }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Se guarda automáticamente al salir del campo
              </div>
            </div>

            <button onClick={onClose} style={{
              width: '100%', padding: '13px', borderRadius: '10px', marginTop: '16px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem',
            }}>Cerrar</button>
          </>
        )}
      </div>
    </div>
  );
}
