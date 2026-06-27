import React, { useState, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar';
import StatsBar from './components/StatsBar';
import PnlChart from './components/PnlChart';
import TradeModal from './components/TradeModal';
import { fetchTrades, saveTrade, deleteTrade } from './api';

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const s = {
  app: { maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
  },
  brand: { display: 'flex', flexDirection: 'column', gap: '2px' },
  title: { fontWeight: 700, fontSize: '1.3rem', letterSpacing: '-0.01em', color: 'var(--text)' },
  subtitle: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  navRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  monthLabel: {
    fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '1rem',
    color: 'var(--text)', minWidth: '180px', textAlign: 'center',
  },
  navBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '8px', width: '36px', height: '36px',
    cursor: 'pointer', fontSize: '1rem', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  todayBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-dim)', borderRadius: '8px', padding: '0 14px', height: '36px',
    cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--sans)',
  },
  error: {
    background: 'var(--red-bg)', border: '1px solid var(--red-border)',
    borderRadius: '8px', padding: '12px 16px', color: 'var(--red)',
    fontSize: '0.85rem', marginBottom: '16px',
  },
};

export default function App() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // { date, existing }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrades(year, month);
      setTrades(data);
    } catch (e) {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); };

  const handleDayClick = (date, existing) => setModal({ date, existing });

  const handleSave = async (data) => {
    try {
      await saveTrade(data);
      setModal(null);
      load();
    } catch (e) {
      setError('Error guardando. Intenta de nuevo.');
    }
  };

  const handleDelete = async (date) => {
    try {
      await deleteTrade(date);
      setModal(null);
      load();
    } catch (e) {
      setError('Error eliminando. Intenta de nuevo.');
    }
  };

  return (
    <div style={s.app}>
      <div style={s.topBar}>
        <div style={s.brand}>
          <div style={s.title}>📈 Trading Dashboard</div>
          <div style={s.subtitle}>Haz clic en cualquier día para registrar o editar</div>
        </div>
        <div style={s.navRow}>
          <button style={s.navBtn} onClick={prevMonth}>‹</button>
          <div style={s.monthLabel}>{MONTHS_ES[month - 1]} {year}</div>
          <button style={s.navBtn} onClick={nextMonth}>›</button>
          <button style={s.todayBtn} onClick={goToday}>Hoy</button>
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <StatsBar trades={trades} />
      <PnlChart trades={trades} />

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
          Cargando...
        </div>
      ) : (
        <Calendar year={year} month={month} trades={trades} onDayClick={handleDayClick} />
      )}

      {modal && (
        <TradeModal
          date={modal.date}
          existing={modal.existing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
