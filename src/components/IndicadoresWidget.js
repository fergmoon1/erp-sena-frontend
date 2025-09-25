import React, { useEffect, useState } from 'react';
import './IndicadoresWidget.css';
import { LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const ICONS = {
  'USD/COP': '💵',
  'USD/EUR': '💶',
  'EUR/COP': '💶',
  'PetroleoBrent': '🛢️',
  'Cafe': '☕',
  'Oro': '🥇',
  'Bitcoin': '₿',
  'IPC_Colombia': '📈',
  'SP500': '📊',
  'DowJones': '🏦',
  'TasaInteresColombia': '💹',
};

const LABELS = {
  'USD/COP': 'Dólar (USD/COP)',
  'USD/EUR': 'Dólar/Euro',
  'EUR/COP': 'Euro (EUR/COP)',
  'PetroleoBrent': 'Petróleo Brent',
  'Cafe': 'Café',
  'Oro': 'Oro',
  'Bitcoin': 'Bitcoin',
  'IPC_Colombia': 'IPC Colombia',
  'SP500': 'S&P 500',
  'DowJones': 'Dow Jones',
  'TasaInteresColombia': 'Tasa Interés COL',
};

const COLORS = {
  'USD/COP': '#1976d2',
  'USD/EUR': '#1976d2',
  'EUR/COP': '#1976d2',
  'PetroleoBrent': '#fbc02d',
  'Cafe': '#795548',
  'Oro': '#ffd700',
  'Bitcoin': '#f7931a',
  'IPC_Colombia': '#43a047',
  'SP500': '#1976d2',
  'DowJones': '#1976d2',
  'TasaInteresColombia': '#e53935',
};

const IndicadoresWidget = () => {
  const [indicadores, setIndicadores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, key: null });

  useEffect(() => {
    const fetchIndicadores = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('jwt');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:8081/api/indicadores', { headers });
        if (!res.ok) throw new Error('Error al obtener indicadores');
        const data = await res.json();
        setIndicadores(data);
      } catch (err) {
        setError('No se pudieron cargar los indicadores.');
      } finally {
        setLoading(false);
      }
    };
    fetchIndicadores();
  }, []);

  const getTrend = (variacion) => {
    if (variacion > 0) return <span className="trend-up">▲</span>;
    if (variacion < 0) return <span className="trend-down">▼</span>;
    return <span className="trend-flat">→</span>;
  };

  const openModal = (key) => setModal({ open: true, key });
  const closeModal = () => setModal({ open: false, key: null });

  if (loading) return <div className="indicadores-widget">Cargando indicadores...</div>;
  if (error) return <div className="indicadores-widget error">{error}</div>;

  return (
    <div className="indicadores-widget">
      <h2>Indicadores Económicos</h2>
      <div className="indicadores-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', padding: '8px' }}>
        {Object.keys(LABELS).map((key) => {
          const data = indicadores[key];
          if (!data) return (
            <div className="indicador-card" key={key} style={{ borderColor: COLORS[key], minWidth: 0, minHeight: 0, padding: '10px 6px', fontSize: '0.85em', height: 80 }}>
              <div className="indicador-icon" style={{ color: COLORS[key], fontSize: '1.5em', marginBottom: 2 }}>{ICONS[key]}</div>
              <div className="indicador-label" style={{ fontSize: '0.95em', marginBottom: 2 }}>{LABELS[key]}</div>
              <div className="indicador-value" style={{ fontSize: '1.1em' }}>N/D</div>
            </div>
          );
          const variacion = data.variacion || 0;
          const trend = getTrend(variacion);
          const variacionAbs = Math.abs(variacion).toFixed(2);
          return (
            <div
              className="indicador-card"
              key={key}
              style={{ borderColor: COLORS[key], minWidth: 0, minHeight: 0, padding: '10px 6px', fontSize: '0.85em', height: 80 }}
              title={`Valor anterior: ${data.anterior}`}
              onClick={() => openModal(key)}
            >
              <div className="indicador-icon" style={{ color: COLORS[key], fontSize: '1.5em', marginBottom: 2 }}>{ICONS[key]}</div>
              <div className="indicador-label" style={{ fontSize: '0.95em', marginBottom: 2 }}>{LABELS[key]}</div>
              <div className="indicador-value" style={{ fontSize: '1.1em' }}>
                {data.valor}
                <span className={`indicador-variacion ${variacion > 0 ? 'up' : variacion < 0 ? 'down' : 'flat'}`}
                      title={`Variación diaria: ${variacion > 0 ? '+' : ''}${variacionAbs}%`}>
                  {trend} {variacion > 0 ? '+' : ''}{variacionAbs}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Modal para gráfico histórico */}
      {modal.open && indicadores[modal.key] && (
        <div className="indicador-modal-bg" onClick={closeModal}>
          <div className="indicador-modal" onClick={e => e.stopPropagation()}>
            <button className="indicador-modal-close" onClick={closeModal}>×</button>
            <h3>{LABELS[modal.key]} - Histórico</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={indicadores[modal.key].historico.map((v, i) => ({
                  dia: `Día ${i + 1}`,
                  valor: v
                }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="dia" stroke={COLORS[modal.key]} />
                <YAxis stroke={COLORS[modal.key]} />
                <ChartTooltip formatter={(value) => [value, 'Valor']} />
                <Line type="monotone" dataKey="valor" stroke={COLORS[modal.key]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="indicador-modal-detalles">
              <strong>Valor actual:</strong> {indicadores[modal.key].valor}<br />
              <strong>Valor anterior:</strong> {indicadores[modal.key].anterior}<br />
              <strong>Variación diaria:</strong> {indicadores[modal.key].variacion > 0 ? '+' : ''}{indicadores[modal.key].variacion.toFixed(2)}%<br />
              <strong>Fecha:</strong> {indicadores[modal.key].fecha}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicadoresWidget; 