import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Eye, X, ArrowRight } from 'lucide-react';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null); // Para el modal

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('auditoria')
      .select('*, perfiles(nombres)')
      .order('fecha_accion', { ascending: false })
      .limit(200);
      
    if (!error) setLogs(data || []);
    setLoading(false);
  };

  const formatJson = (jsonObj) => {
    if (!jsonObj) return 'N/A';
    try {
      return JSON.stringify(jsonObj, null, 2);
    } catch (e) {
      return String(jsonObj);
    }
  };

  return (
    <div className="page-container animate-fade-in flex-col h-full">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">Auditoría del Sistema</h2>
          <p className="text-muted">Registro inmutable de actividades y modificaciones.</p>
        </div>
        <button onClick={fetchData} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} /> Actualizar
        </button>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
          {loading ? <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div> : (
            <table style={{ width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Fecha y Hora</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Usuario (Responsable)</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Tabla</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Acción</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>ID Afectado</th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted" style={{padding:'2rem'}}>No hay registros de auditoría aún.</td></tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id_auditoria} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover-bg">
                      <td style={{ padding: '1rem', fontSize:'0.85rem' }}>{new Date(log.fecha_accion).toLocaleString()}</td>
                      <td style={{ padding: '1rem' }} className="font-medium text-primary">{log.perfiles?.nombres || log.id_perfil || 'Sistema'}</td>
                      <td style={{ padding: '1rem' }}><span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{log.tabla_afectada}</span></td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${log.accion === 'INSERT' ? 'badge-success' : log.accion === 'UPDATE' ? 'badge-warning' : 'badge-danger'}`}>
                          {log.accion}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontFamily:'monospace', fontSize:'0.9rem', color:'var(--text-muted)' }}>
                        {log.id_registro_afectado || '-'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="btn-icon" 
                          style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                          title="Ver Detalle"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE DETALLES DE AUDITORÍA */}
      {selectedLog && (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content animate-scale" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                Detalle de Auditoría #{selectedLog.id_auditoria}
              </h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} className="text-muted" /></button>
            </div>
            
            <div className="modal-body custom-scrollbar" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', backgroundColor: '#f8fafc' }}>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-neutral">Tabla: {selectedLog.tabla_afectada}</span>
                <span className={`badge ${selectedLog.accion === 'INSERT' ? 'badge-success' : selectedLog.accion === 'UPDATE' ? 'badge-warning' : 'badge-danger'}`}>
                  Acción: {selectedLog.accion}
                </span>
                <span className="badge badge-neutral">Responsable: {selectedLog.perfiles?.nombres || 'Sistema'}</span>
                <span className="badge badge-neutral">ID Registro: {selectedLog.id_registro_afectado || 'N/A'}</span>
              </div>

              {selectedLog.accion === 'UPDATE' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '1rem', alignItems: 'start' }}>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', borderTop: '4px solid #ef4444' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>ANTES (Dato Anterior)</h4>
                    <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {formatJson(selectedLog.dato_anterior)}
                    </pre>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    <ArrowRight size={24} />
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', borderTop: '4px solid #10b981' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>DESPUÉS (Dato Nuevo)</h4>
                    <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {formatJson(selectedLog.dato_nuevo)}
                    </pre>
                  </div>
                </div>
              ) : selectedLog.accion === 'INSERT' ? (
                 <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', borderTop: '4px solid #10b981' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>DATO INSERTADO</h4>
                  <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {formatJson(selectedLog.dato_nuevo)}
                  </pre>
                </div>
              ) : (
                <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', borderTop: '4px solid #ef4444' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>DATO ELIMINADO</h4>
                  <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {formatJson(selectedLog.dato_anterior)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'white' }}>
              <button onClick={() => setSelectedLog(null)} className="btn btn-outline">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auditoria;
