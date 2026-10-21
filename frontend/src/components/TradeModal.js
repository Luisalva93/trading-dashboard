import React, { useState, useEffect, useRef } from 'react';
import { fetchDayTrades, addTrade, updateTrade, deleteTrade, saveNotes, deleteDay } from '../api';

const INSTRUMENTS = ['MNQ', 'NQ', 'MES', 'ES', 'YM', 'RTY'];
const SETUPS = ['ORB', 'Pullback', 'Reversión', 'Breakout', 'VWAP', 'Scalp', 'Martillo', 'Otro'];
const CLOUD_NAME = 'ye7uptsx';
const UPLOAD_PRESET = 'trading-dashboard';

const SESSION_LABELS = { NY: '🗽 New York', LDN: '🇬🇧 London', ASIA: '🌏 Asia' };

const inputStyle = { width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' };
const selectStyle = { ...inputStyle, fontFamily: 'var(--sans)', cursor: 'pointer' };

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'trading-dashboard');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: formData,
  });
  if (!res.ok) throw new Error('Error subiendo imagen');
  const data = await res.json();
  return data.secure_url;
}

function ImageUploader({ imageUrl, onImageChange }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(imageUrl || '');
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => { setPreview(imageUrl || ''); }, [imageUrl]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(file);
      const url = await uploadToCloudinary(file);
      setPreview(url);
      onImageChange(url);
    } catch (e) {
      alert('Error subiendo imagen: ' + e.message);
    } finally { setUploading(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  return (
    <div>
      <label style={labelStyle}>Imagen del trade</label>
      {preview ? (
        <div>
          <div onClick={() => setLightbox(true)} style={{ width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', border: '1px solid var(--border)' }}>
            <img src={preview} alt="Trade" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button onClick={() => fileRef.current.click()} disabled={uploading}
              style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>
              {uploading ? '⏳ Subiendo...' : '🔄 Cambiar'}
            </button>
            <button onClick={() => { setPreview(''); onImageChange(''); }}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--red-border)', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '0.78rem' }}>
              🗑️
            </button>
          </div>
        </div>
      ) : (
        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileRef.current.click()}
          style={{ width: '100%', height: '100px', borderRadius: '10px', border: `2px dashed ${uploading ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '6px', background: uploading ? 'var(--accent-glow)' : 'transparent', transition: 'all 0.2s' }}>
          {uploading ? (
            <><div style={{ fontSize: '1.3rem' }}>⏳</div><div style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>Subiendo imagen...</div></>
          ) : (
            <><div style={{ fontSize: '1.5rem' }}>📸</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>Clic o arrastra una imagen</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.6 }}>Screenshot de TradingView, gráfica, etc.</div></>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', padding: '20px' }}>
          <img src={preview} alt="Trade" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
          <button onClick={() => setLightbox(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
      )}
    </div>
  );
}

function RiskDisplay({ pnl, accountSize, riskPct }) {
  const pnlVal = parseFloat(pnl) || 0;
  const accVal = parseFloat(accountSize) || 0;
  const riskVal = parseFloat(riskPct) || 0;
  if (!accVal && !riskVal) return null;
  // How much $ does the risk represent
  let riskDollar = null;
  if (accVal && riskVal) riskDollar = (accVal * riskVal / 100).toFixed(0);
  else if (accVal && pnlVal < 0) riskDollar = Math.abs(pnlVal).toFixed(0);
  const displayPct = riskVal || (accVal && pnlVal < 0 ? (Math.abs(pnlVal) / accVal * 100).toFixed(2) : null);
  if (!displayPct) return null;
  const color = parseFloat(displayPct) <= 1 ? 'var(--green)' : parseFloat(displayPct) <= 2 ? '#f59e0b' : 'var(--red)';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', fontSize: '0.72rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>Riesgo:</span>
      <span style={{ color, fontFamily: 'var(--mono)', fontWeight: 700 }}>{parseFloat(displayPct).toFixed(2)}%</span>
      {riskDollar && <span style={{ color: 'var(--text-muted)' }}>= ${riskDollar}</span>}
    </div>
  );
}

function TradeRow({ trade, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [pnl, setPnl] = useState(trade.pnl);
  const [instrument, setInstrument] = useState(trade.instrument || 'MNQ');
  const [setup, setSetup] = useState(trade.setup || '');
  const [entryTime, setEntryTime] = useState(trade.entry_time || '');
  const [notes, setNotes] = useState(trade.notes || '');
  const [imageUrl, setImageUrl] = useState(trade.image_url || '');
  const [accountSize, setAccountSize] = useState(trade.account_size || '');
  const [riskPct, setRiskPct] = useState(trade.risk_pct || '');
  const [lightbox, setLightbox] = useState(false);
  const pnlVal = parseFloat(trade.pnl);

  // Auto-calc risk_pct from account_size + pnl loss when editing
  const autoRisk = accountSize && pnl && parseFloat(pnl) < 0
    ? (Math.abs(parseFloat(pnl)) / parseFloat(accountSize) * 100).toFixed(2)
    : '';
  const displayRisk = riskPct || autoRisk;

  if (editing) return (
    <div style={{ background: 'var(--surface2)', borderRadius: '12px', padding: '14px', marginBottom: '10px', border: '1px solid var(--accent)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <div><label style={labelStyle}>P&L ($)</label><input style={inputStyle} type="number" step="0.01" value={pnl} onChange={e => setPnl(e.target.value)} /></div>
        <div><label style={labelStyle}>Hora</label><input style={inputStyle} type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} /></div>
        <div><label style={labelStyle}>Instrumento</label><select style={selectStyle} value={instrument} onChange={e => setInstrument(e.target.value)}>{INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
        <div><label style={labelStyle}>Setup</label><select style={selectStyle} value={setup} onChange={e => setSetup(e.target.value)}><option value="">— Ninguno —</option>{SETUPS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div>
          <label style={labelStyle}>Tamaño de cuenta ($)</label>
          <input style={inputStyle} type="number" step="1" placeholder="Ej: 10000" value={accountSize} onChange={e => setAccountSize(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Riesgo % <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(auto si vacío)</span></label>
          <input style={inputStyle} type="number" step="0.01" placeholder={autoRisk || '1.00'} value={riskPct} onChange={e => setRiskPct(e.target.value)} />
        </div>
      </div>
      {(accountSize || riskPct) && (
        <div style={{ marginBottom: '10px' }}>
          <RiskDisplay pnl={pnl} accountSize={accountSize} riskPct={riskPct} />
        </div>
      )}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Notas del trade</label>
        <textarea placeholder="¿Qué pasó en este trade?" value={notes} onChange={e => setNotes(e.target.value)}
          style={{ ...inputStyle, fontFamily: 'var(--sans)', fontSize: '0.88rem', resize: 'none', minHeight: '70px', lineHeight: 1.5 }} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <ImageUploader imageUrl={imageUrl} onImageChange={setImageUrl} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onDelete(trade.id)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--red-border)', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
        <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancelar</button>
        <button onClick={() => { onUpdate(trade.id, { pnl: parseFloat(pnl), instrument, setup, entry_time: entryTime, notes, image_url: imageUrl, account_size: accountSize || null, risk_pct: riskPct || null }); setEditing(false); }}
          style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
      </div>
    </div>
  );

  // View mode risk chip
  const tradeRiskPct = trade.risk_pct ? parseFloat(trade.risk_pct) : null;
  const tradeAccSize = trade.account_size ? parseFloat(trade.account_size) : null;
  const riskDollar = tradeAccSize && tradeRiskPct ? (tradeAccSize * tradeRiskPct / 100).toFixed(0) : null;

  return (
    <div style={{ background: 'var(--surface2)', borderRadius: '12px', marginBottom: '8px', border: `1px solid ${pnlVal > 0 ? 'var(--green-border)' : pnlVal < 0 ? 'var(--red-border)' : 'var(--border)'}`, overflow: 'hidden' }}>
      <div onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pnlVal > 0 ? 'var(--green)' : pnlVal < 0 ? 'var(--red)' : 'var(--text-muted)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {trade.instrument || 'MNQ'}{trade.setup ? ` · ${trade.setup}` : ''}{trade.entry_time ? ` · ${trade.entry_time}` : ''}
            </div>
            {tradeRiskPct && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>⚠️</span>
                <span style={{ color: tradeRiskPct <= 1 ? 'var(--green)' : tradeRiskPct <= 2 ? '#f59e0b' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{tradeRiskPct.toFixed(2)}% riesgo</span>
                {riskDollar && <span style={{ color: 'var(--text-muted)' }}>· ${riskDollar}</span>}
              </div>
            )}
            {trade.notes && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📝 {trade.notes}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {trade.image_url && (
            <div onClick={e => { e.stopPropagation(); setLightbox(true); }}
              style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', cursor: 'zoom-in', border: '1px solid var(--border)', flexShrink: 0 }}>
              <img src={trade.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1rem', color: pnlVal > 0 ? 'var(--green)' : pnlVal < 0 ? 'var(--red)' : 'var(--text)' }}>
            {pnlVal > 0 ? '+' : ''}${Math.abs(pnlVal).toFixed(0)}
          </div>
        </div>
      </div>
      {trade.image_url && (
        <div onClick={() => setLightbox(true)} style={{ width: '100%', height: '120px', overflow: 'hidden', cursor: 'zoom-in', borderTop: '1px solid var(--border)' }}>
          <img src={trade.image_url} alt="Trade" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', padding: '20px' }}>
          <img src={trade.image_url} alt="Trade" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
          <button onClick={() => setLightbox(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
      )}
    </div>
  );
}

export default function TradeModal({ date, session, onClose, onRefresh }) {
  const [dayData, setDayData] = useState({ trades: [], notes: '' });
  const [loading, setLoading] = useState(true);
  const [dayNotes, setDayNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPnl, setNewPnl] = useState('');
  const [newInstrument, setNewInstrument] = useState('MNQ');
  const [newSetup, setNewSetup] = useState('');
  const [newEntryTime, setNewEntryTime] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAccountSize, setNewAccountSize] = useState('');
  const [newRiskPct, setNewRiskPct] = useState('');

  const [y, m, d] = date.split('-').map(Number);
  const formatted = new Date(y, m-1, d).toLocaleDateString('es-MX', { weekday: 'long', month: 'long', day: 'numeric' });
  const sessionLabel = SESSION_LABELS[session] || session;

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDayTrades(date, session);
      setDayData(data); setDayNotes(data.notes || '');
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [date, session]);

  const totalPnl = dayData.trades.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const wins = dayData.trades.filter(t => parseFloat(t.pnl) > 0).length;

  const newAutoRisk = newAccountSize && newPnl && parseFloat(newPnl) < 0
    ? (Math.abs(parseFloat(newPnl)) / parseFloat(newAccountSize) * 100).toFixed(2) : '';

  const handleAddTrade = async () => {
    if (newPnl === '') return;
    await addTrade({ date, pnl: parseFloat(newPnl), instrument: newInstrument, setup: newSetup, entry_time: newEntryTime, session, notes: newNotes, image_url: newImageUrl, account_size: newAccountSize || null, risk_pct: newRiskPct || null });
    setNewPnl(''); setNewSetup(''); setNewEntryTime(''); setNewNotes(''); setNewImageUrl(''); setNewAccountSize(''); setNewRiskPct('');
    setShowAddForm(false);
    await load(); onRefresh();
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', width: '100%', maxWidth: '520px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -4px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)', textTransform: 'capitalize' }}>{formatted}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '2px', fontWeight: 600 }}>{sessionLabel}</div>
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
            <button onClick={async () => { if (window.confirm('¿Eliminar todos los trades de este día?')) { await deleteDay(date, session); onClose(); onRefresh(); } }}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--red-border)', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '0.75rem' }}>
              Borrar día
            </button>
          )}
        </div>

        {loading ? <div style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>Cargando...</div> : (
          <>
            {dayData.trades.map(t => (
              <TradeRow key={t.id} trade={t}
                onUpdate={async (id, data) => { await updateTrade(id, data); await load(); onRefresh(); }}
                onDelete={async (id) => { await deleteTrade(id); await load(); onRefresh(); }} />
            ))}

            {showAddForm ? (
              <div style={{ background: 'var(--surface2)', borderRadius: '14px', padding: '16px', marginBottom: '12px', border: '1px solid var(--accent)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '14px' }}>
                  Nuevo trade — {sessionLabel}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div><label style={labelStyle}>P&L ($) *</label><input style={inputStyle} type="number" step="0.01" placeholder="0.00" value={newPnl} onChange={e => setNewPnl(e.target.value)} autoFocus /></div>
                  <div><label style={labelStyle}>Hora entrada</label><input style={inputStyle} type="time" value={newEntryTime} onChange={e => setNewEntryTime(e.target.value)} /></div>
                  <div><label style={labelStyle}>Instrumento</label><select style={selectStyle} value={newInstrument} onChange={e => setNewInstrument(e.target.value)}>{INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                  <div><label style={labelStyle}>Setup</label><select style={selectStyle} value={newSetup} onChange={e => setNewSetup(e.target.value)}><option value="">— Ninguno —</option>{SETUPS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div>
                    <label style={labelStyle}>Tamaño de cuenta ($)</label>
                    <input style={inputStyle} type="number" step="1" placeholder="Ej: 10000" value={newAccountSize} onChange={e => setNewAccountSize(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Riesgo % <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(auto si vacío)</span></label>
                    <input style={inputStyle} type="number" step="0.01" placeholder={newAutoRisk || '1.00'} value={newRiskPct} onChange={e => setNewRiskPct(e.target.value)} />
                  </div>
                </div>
                {(newAccountSize || newRiskPct) && (
                  <div style={{ marginBottom: '8px' }}>
                    <RiskDisplay pnl={newPnl} accountSize={newAccountSize} riskPct={newRiskPct} />
                  </div>
                )}
                <div style={{ marginBottom: '10px' }}>
                  <label style={labelStyle}>Notas del trade</label>
                  <textarea placeholder="¿Qué pasó? Entrada, salida, emociones..." value={newNotes} onChange={e => setNewNotes(e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'var(--sans)', fontSize: '0.88rem', resize: 'none', minHeight: '70px', lineHeight: 1.5 }} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <ImageUploader imageUrl={newImageUrl} onImageChange={setNewImageUrl} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setShowAddForm(false); setNewPnl(''); setNewNotes(''); setNewImageUrl(''); }}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleAddTrade}
                    style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>Agregar Trade</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)}
                style={{ width: '100%', padding: '13px', borderRadius: '10px', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '12px' }}>
                + Agregar trade
              </button>
            )}

            <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <label style={labelStyle}>Notas generales del día</label>
              <textarea placeholder="Contexto del mercado, plan del día, reflexiones..." value={dayNotes} onChange={e => setDayNotes(e.target.value)}
                onBlur={() => saveNotes(date, dayNotes, session)}
                style={{ ...inputStyle, fontFamily: 'var(--sans)', fontSize: '0.88rem', resize: 'none', minHeight: '70px', lineHeight: 1.5 }} />
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>Se guarda automáticamente · Usado en el Análisis IA</div>
            </div>

            <button onClick={onClose}
              style={{ width: '100%', padding: '13px', borderRadius: '10px', marginTop: '14px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
