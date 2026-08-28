import React, { useState } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';
const MONTHS_ES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function parseTable(lines, startIndex) {
  const tableLines = [];
  let i = startIndex;
  while (i < lines.length && lines[i].trim().startsWith('|')) { tableLines.push(lines[i].trim()); i++; }
  if (tableLines.length < 2) return { table: null, endIndex: startIndex };
  const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = tableLines.slice(2).map(row => row.split('|').map(c => c.trim()).filter(Boolean)).filter(r => r.length > 0);
  return { table: { headers, rows }, endIndex: i };
}

function TableComponent({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i} style={{ padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, textAlign: 'left' }}>{h.replace(/\*\*/g, '')}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '8px 12px', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>{cell.replace(/\*\*/g, '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderAnalysis(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const clean = line.replace(/^#{1,4}\s*/, '').replace(/\*\*/g, '');
    if (line.trim().startsWith('|')) {
      const { table, endIndex } = parseTable(lines, i);
      if (table) { elements.push(<TableComponent key={i} headers={table.headers} rows={table.rows} />); i = endIndex; continue; }
    }
    if (line.match(/^#{1,2}\s/)) elements.push(<div key={i} style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '24px', marginBottom: '8px' }}>{clean}</div>);
    else if (line.match(/^###\s/)) elements.push(<div key={i} style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem', marginTop: '16px', marginBottom: '6px', borderLeft: '3px solid var(--accent)', paddingLeft: '10px' }}>{clean}</div>);
    else if (line.startsWith('→') || line.startsWith('- ') || line.startsWith('• ')) elements.push(<div key={i} style={{ color: 'var(--text-dim)', fontSize: '0.88rem', paddingLeft: '16px', marginBottom: '5px', lineHeight: 1.6 }}>→ {line.replace(/^[→\-•]\s*/, '').replace(/\*\*/g, '')}</div>);
    else if (line.match(/^\d+\.\s/)) elements.push(<div key={i} style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.92rem', marginTop: '10px', marginBottom: '4px' }}>{clean}</div>);
    else if (line.match(/^---+$/)) elements.push(<div key={i} style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />);
    else if (line.trim() === '') elements.push(<div key={i} style={{ height: '6px' }} />);
    else elements.push(<div key={i} style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '3px' }}>{line.replace(/\*\*/g, '')}</div>);
    i++;
  }
  return elements;
}

export default function Analysis({ currentYear, currentMonth, session }) {
  const [mode, setMode] = useState('single'); // single | compare
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const now = new Date();
  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) years.push(y);

  const selectStyle = { width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' };

  const analyze = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const endpoint = mode === 'compare' ? '/api/analysis/compare' : '/api/analysis/monthly';
      const body = mode === 'compare'
        ? { year: selectedYear, month: selectedMonth }
        : { year: selectedYear, month: selectedMonth, session };
      const res = await fetch(BASE + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al analizar');
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const sessionLabel = session === 'NY' ? '🗽 New York' : '🇬🇧 London';

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '4px' }}>🧠 Análisis Psicológico IA</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Detecta patrones emocionales y compara tus sesiones</div>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
        {[
          { id: 'single', label: `Analizar ${sessionLabel}` },
          { id: 'compare', label: '⚡ Comparar NY vs London' },
        ].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(null); setError(null); }}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: mode === m.id ? 'var(--accent)' : 'transparent', color: mode === m.id ? '#fff' : 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: mode === m.id ? 600 : 400, transition: 'all 0.15s' }}>
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Mes</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={selectStyle}>
              {Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>{MONTHS_ES[m]}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Año</label>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={selectStyle}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={analyze} disabled={loading}
            style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: loading ? 'var(--border)' : 'var(--accent)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {loading ? 'Analizando...' : mode === 'compare' ? '⚡ Comparar' : '🧠 Analizar'}
          </button>
        </div>
        {loading && <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Analizando tus trades... ⏳</div>}
      </div>

      {error && <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: '10px', padding: '14px 16px', color: 'var(--red)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>}

      {result && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {mode === 'compare' ? '⚡ Comparación' : `Análisis ${sessionLabel}`} · <strong style={{ color: 'var(--text)' }}>{MONTHS_ES[selectedMonth]} {selectedYear}</strong>
            </div>
            {result.totalPnl !== undefined && (
              <><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>·</div>
              <div style={{ fontSize: '0.8rem', color: result.totalPnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{result.totalPnl >= 0 ? '+' : ''}${parseFloat(result.totalPnl).toFixed(0)}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>·</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{result.totalTrades} trades · {result.winRate}% win rate</div></>
            )}
          </div>

          {/* Compare summary chips */}
          {mode === 'compare' && (result.nyData || result.ldnData) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[{ label: '🗽 New York', data: result.nyData }, { label: '🇬🇧 London', data: result.ldnData }].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface2)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>{s.label}</div>
                  {s.data ? (
                    <>
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.1rem', color: parseFloat(s.data.totalPnl) >= 0 ? 'var(--green)' : 'var(--red)', marginBottom: '4px' }}>
                        {parseFloat(s.data.totalPnl) >= 0 ? '+' : ''}${parseFloat(s.data.totalPnl).toFixed(0)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.data.totalTrades} trades · {s.data.winRate}% win · PF {s.data.profitFactor}</div>
                    </>
                  ) : <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin datos</div>}
                </div>
              ))}
            </div>
          )}

          <div style={{ lineHeight: 1.7 }}>{renderAnalysis(result.analysis)}</div>
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            Análisis generado por Claude IA · Basado en tus trades reales
          </div>
        </div>
      )}
    </div>
  );
}
