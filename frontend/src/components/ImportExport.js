import React, { useState, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const downloadBackup = (type) => window.open(`${BASE}/api/export/${type}`, '_blank');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) throw new Error('El archivo está vacío o no tiene datos');

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[&\s]/g, '_'));

      // Parse rows
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
        return obj;
      }).filter(r => r.fecha && r.p_l !== '' && r.p_l !== undefined);

      if (rows.length === 0) throw new Error('No se encontraron filas válidas en el CSV');

      // Normalize keys — handle both "p&l" and "pnl"
      const normalized = rows.map(r => ({
        fecha: r.fecha,
        pnl: r.p_l || r.pnl || r['p&l'] || '0',
        instrumento: r.instrumento || r.instrument || 'NQ',
        setup: r.setup || '',
        hora_entrada: r.hora_entrada || r.hora || r.entry_time || '',
        notas_del_dia: r.notas_del_d_a || r.notas_del_dia || r.notes || '',
      }));

      const res = await fetch(`${BASE}/api/export/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: normalized }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar');
      setResult(data);

    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
      fileRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Export buttons */}
      <button onClick={() => downloadBackup('csv')} title="Descargar todos tus trades en CSV"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', padding: '0 12px', height: '36px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
        💾 Exportar CSV
      </button>
      <button onClick={() => downloadBackup('json')} title="Descargar respaldo JSON completo"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', padding: '0 12px', height: '36px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
        💾 JSON
      </button>

      {/* Import button */}
      <button onClick={() => fileRef.current.click()} disabled={importing}
        title="Importar trades desde un CSV exportado anteriormente"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: importing ? 'var(--text-muted)' : 'var(--accent)', borderRadius: '8px', padding: '0 12px', height: '36px', cursor: importing ? 'not-allowed' : 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
        {importing ? '⏳ Importando...' : '📂 Importar CSV'}
      </button>
      <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Result toast */}
      {result && (
        <div style={{ fontSize: '0.75rem', color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: '6px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ✅ {result.inserted} importados · {result.skipped} omitidos {result.errors > 0 ? `· ${result.errors} errores` : ''}
          <button onClick={() => setResult(null)} style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px' }}>✕</button>
        </div>
      )}
      {error && (
        <div style={{ fontSize: '0.75rem', color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: '6px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ❌ {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px' }}>✕</button>
        </div>
      )}
    </div>
  );
}
