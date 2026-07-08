import React, { useState, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase()
    .replace('fecha', 'fecha')
    .replace('p&l', 'pnl')
    .replace('instrumento', 'instrumento')
    .replace('setup', 'setup')
    .replace('hora entrada', 'hora_entrada')
    .replace('notas del día', 'notas_del_dia')
    .replace('notas del dia', 'notas_del_dia')
  );
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
    return obj;
  }).filter(r => r.fecha);
}

export default function BackupImport({ onImported }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true); setError(null); setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setError('El archivo no tiene datos válidos o el formato no es compatible.');
        setImporting(false);
        return;
      }

      const res = await fetch(`${BASE}/api/export/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar');
      setResult(data);
      if (data.imported > 0 && onImported) onImported();
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
      fileRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />

      <button
        onClick={() => fileRef.current.click()}
        disabled={importing}
        title="Importar trades desde CSV"
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', borderRadius: '8px',
          padding: '0 12px', height: '36px', cursor: importing ? 'wait' : 'pointer',
          fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px',
        }}
      >
        {importing ? '⏳ Importando...' : '📂 Importar CSV'}
      </button>

      {/* Result toast */}
      {result && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: 'var(--surface)', border: '1px solid var(--green-border)',
          borderRadius: '12px', padding: '14px 18px', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minWidth: '220px',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: '6px' }}>✅ Importación completa</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {result.imported} trades importados<br />
            {result.skipped > 0 && <>{result.skipped} omitidos<br /></>}
            {result.errors > 0 && <span style={{ color: 'var(--red)' }}>{result.errors} con error</span>}
          </div>
          <button onClick={() => setResult(null)}
            style={{ marginTop: '10px', width: '100%', padding: '6px', borderRadius: '6px', border: 'none', background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}>
            Cerrar
          </button>
        </div>
      )}

      {error && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: 'var(--red-bg)', border: '1px solid var(--red-border)',
          borderRadius: '12px', padding: '14px 18px', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minWidth: '220px',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: '6px' }}>❌ Error al importar</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{error}</div>
          <button onClick={() => setError(null)}
            style={{ marginTop: '10px', width: '100%', padding: '6px', borderRadius: '6px', border: 'none', background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
