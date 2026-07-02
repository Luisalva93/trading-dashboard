import React, { useState, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar';
import StatsBar from './components/StatsBar';
import PnlChart from './components/PnlChart';
import TradeModal from './components/TradeModal';
import History from './pages/History';
import Analysis from './pages/Analysis';
import { fetchTrades, fetchMonthStats } from './api';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const NAV = [
  { id: 'calendar', label: '📅 Dashboard' },
  { id: 'history', label: '📊 Historial' },
  { id: 'analysis', label: '🧠 Análisis IA' },
];

export default function App() {
  const now = new Date();
  const [view, setView] = useState('calendar');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tradeData, statsData] = await Promise.all([
        fetchTrades(year, month),
        fetchMonthStats(year, month),
      ]);
      setTrades(tradeData);
      setStats(statsData);
    } catch (e) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { if (view === 'calendar') load(); }, [load, view]);

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const handleSelectMonth = (y, m) => { setYear(y); setMonth(m); setView('calendar'); };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(12px, 3vw, 24px) clamp(12px, 3vw, 20px)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'clamp(1rem, 3vw, 1.3rem)', letterSpacing: '-0.01em', color: 'var(--text)' }}>📈 Trading Dashboard</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {view === 'calendar' ? 'Haz clic en cualquier día para registrar trades' : view === 'history' ? 'Resumen de todos tus meses' : 'Análisis psicológico con IA'}
          </div>
        </div>

        {view === 'calendar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={prevMonth} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem' }}>‹</button>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 'clamp(0.85rem, 2vw, 1rem)', color: 'var(--text)', minWidth: '140px', textAlign: 'center' }}>{MONTHS_ES[month - 1]} {year}</div>
            <button onClick={nextMonth} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem' }}>›</button>
            <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', padding: '0 12px', height: '36px', cursor: 'pointer', fontSize: '0.8rem' }}>Hoy</button>
          </div>
        )}
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            flex: 1, padding: '8px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
            background: view === n.id ? 'var(--surface2)' : 'transparent',
            color: view === n.id ? 'var(--text)' : 'var(--text-muted)',
            fontFamily: 'var(--sans)', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: view === n.id ? 600 : 400,
            transition: 'all 0.15s',
          }}>{n.label}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--red)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>
      )}

      {view === 'calendar' && (
        <>
          <StatsBar trades={trades} stats={stats} />
          <PnlChart trades={trades} />
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Cargando...</div>
          ) : (
            <Calendar year={year} month={month} trades={trades} onDayClick={(date) => setModal(date)} />
          )}
        </>
      )}

      {view === 'history' && <History onSelectMonth={handleSelectMonth} />}
      {view === 'analysis' && <Analysis currentYear={year} currentMonth={month} />}

      {modal && (
        <TradeModal date={modal} onClose={() => setModal(null)} onRefresh={load} />
      )}
    </div>
  );
}
