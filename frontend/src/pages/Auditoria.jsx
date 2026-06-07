import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('auditoria')
      .select('*, perfiles(nombres)')
      .order('fecha_accion', { ascending: false })
      .limit(100);
      
    if (!error) setLogs(data || []);
    setLoading(false);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Auditoría del Sistema</h2>
          <p className="text-muted">Registro inmutable de actividades y modificaciones.</p>
        </div>
      </div>

      <div className="glass-table-container">
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div> : (
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Usuario (Responsable)</th>
                  <th>Tabla Afectada</th>
                  <th>Acción</th>
                  <th>Registro Afectado</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id_auditoria}>
                    <td style={{fontSize:'0.85rem'}}>{new Date(log.fecha_accion).toLocaleString()}</td>
                    <td className="font-medium">{log.perfiles?.nombres || log.id_perfil || 'Sistema'}</td>
                    <td><span className="badge badge-neutral">{log.tabla_afectada}</span></td>
                    <td>
                      <span className={`badge ${log.accion === 'INSERT' ? 'badge-success' : log.accion === 'UPDATE' ? 'badge-warning' : 'badge-danger'}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td style={{fontFamily:'monospace', fontSize:'0.85rem', color:'var(--text-muted)'}}>
                      ID: {log.id_registro_afectado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default Auditoria;
