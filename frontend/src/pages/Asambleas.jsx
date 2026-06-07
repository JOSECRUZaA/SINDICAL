import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Users } from 'lucide-react';

const Asambleas = () => {
  const [asambleas, setAsambleas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo: 'Ordinaria', fecha_hora: '', lugar: '', orden_dia: ''
  });

  const [asistenciaModal, setAsistenciaModal] = useState({ show: false, asamblea: null });
  const [afiliados, setAfiliados] = useState([]);
  const [asistenciaList, setAsistenciaList] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('asambleas').select('*').order('fecha', { ascending: false });
    if (!error) setAsistencia(data || []);
    
    // Traer afiliados activos para la asistencia
    const { data: afData } = await supabase.from('afiliados').select('id_afiliado, numero_afiliado, perfiles(nombres)').eq('estado_organico', 'Activo');
    if (afData) setAfiliados(afData);
    
    setLoading(false);
  };
  
  // Arreglo temporal por el rename arriba (setAsistencia vs setAsambleas)
  const setAsistencia = setAsambleas;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const [fechaStr, horaStr] = formData.fecha_hora.split('T');
    
    const dataToInsert = {
      tipo: formData.tipo, fecha: fechaStr, hora: horaStr,
      lugar: formData.lugar, orden_dia: formData.orden_dia, estado: 'Programada'
    };

    const { error } = await supabase.from('asambleas').insert([dataToInsert]);
    if (!error) {
      setShowModal(false);
      setFormData({ tipo: 'Ordinaria', fecha_hora: '', lugar: '', orden_dia: '' });
      fetchData();
    } else alert('Error: ' + error.message);
  };

  const openAsistencia = async (asamblea) => {
    // Buscar si ya hay asistencia guardada
    const { data } = await supabase.from('asistencia_asamblea').select('*').eq('id_asamblea', asamblea.id_asamblea);
    
    const list = {};
    afiliados.forEach(a => {
      const saved = data?.find(d => d.id_afiliado === a.id_afiliado);
      list[a.id_afiliado] = saved ? saved.estado_asistencia : 'Presente';
    });
    
    setAsistenciaList(list);
    setAsistenciaModal({ show: true, asamblea });
  };

  const handleSaveAsistencia = async () => {
    const { asamblea } = asistenciaModal;
    
    // 1. Guardar asistencia
    const registros = Object.keys(asistenciaList).map(id_afiliado => ({
      id_asamblea: asamblea.id_asamblea,
      id_afiliado: parseInt(id_afiliado),
      estado_asistencia: asistenciaList[id_afiliado],
      fecha_registro: new Date().toISOString()
    }));

    // Borrar anteriores si existían (para evitar duplicados por clave foránea si la tuvieran, o usamos upsert)
    await supabase.from('asistencia_asamblea').delete().eq('id_asamblea', asamblea.id_asamblea);
    await supabase.from('asistencia_asamblea').insert(registros);

    // 2. Generar Multas a los que faltaron
    const multas = [];
    const tipoMultaId = asamblea.tipo === 'Ordinaria' ? 1 : 2; // IDs según base de datos (Ordinaria=1, Extraordinaria=2)
    const montoMulta = asamblea.tipo === 'Ordinaria' ? 100 : 200; // Monto default referencial
    
    Object.keys(asistenciaList).forEach(id_afiliado => {
      if (asistenciaList[id_afiliado] === 'Falta') {
        multas.push({
          id_afiliado: parseInt(id_afiliado),
          id_tipo_multa: tipoMultaId,
          tipo_obligacion: 'Multa',
          concepto: `Falta a Asamblea ${asamblea.tipo} (${asamblea.fecha})`,
          monto_total: montoMulta,
          fecha_limite: new Date().toISOString(),
          estado: 'Pendiente'
        });
      }
    });

    if (multas.length > 0) {
      await supabase.from('obligaciones_financieras').insert(multas);
      alert(`Asistencia guardada. Se generaron ${multas.length} multas por inasistencia.`);
    } else {
      alert('Asistencia guardada correctamente.');
    }

    // Actualizar estado de asamblea
    await supabase.from('asambleas').update({ estado: 'Realizada' }).eq('id_asamblea', asamblea.id_asamblea);
    
    setAsistenciaModal({ show: false, asamblea: null });
    fetchData();
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Asambleas y Reuniones</h2>
          <p className="text-muted">Registro de convocatorias y control de asistencia.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nueva Asamblea
        </button>
      </div>

      <div className="glass-table-container">
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div> : (
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Fecha y Hora</th>
                  <th>Lugar</th>
                  <th>Orden del Día</th>
                  <th>Estado</th>
                  <th>Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {asambleas.map(a => (
                  <tr key={a.id_asamblea}>
                    <td className="font-medium text-white">{a.tipo}</td>
                    <td>{new Date(`${a.fecha}T${a.hora}`).toLocaleString()}</td>
                    <td>{a.lugar}</td>
                    <td><div style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{a.orden_dia}</div></td>
                    <td><span className={`badge ${a.estado === 'Programada' ? 'badge-neutral' : 'badge-success'}`}>{a.estado}</span></td>
                    <td>
                      <button className="btn-outline" style={{padding: '0.25rem 0.5rem', border: '1px solid var(--primary-color)'}} onClick={() => openAsistencia(a)}>
                        <Users size={16} style={{marginRight: '0.25rem'}} />
                        {a.estado === 'Realizada' ? 'Ver/Editar Lista' : 'Tomar Lista'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Nueva Asamblea */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h3 className="modal-title">Programar Asamblea</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Tipo de Asamblea</label>
                  <select name="tipo" required value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                    <option value="Ordinaria">Ordinaria</option>
                    <option value="Extraordinaria">Extraordinaria</option>
                    <option value="Magna">Magna</option>
                    <option value="Directiva">Reunión de Directiva</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Fecha y Hora</label>
                  <input type="datetime-local" required value={formData.fecha_hora} onChange={e => setFormData({...formData, fecha_hora: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Lugar</label>
                  <input type="text" required value={formData.lugar} onChange={e => setFormData({...formData, lugar: e.target.value})} placeholder="Sede sindical..." />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Orden del Día</label>
                  <textarea rows="4" style={{width:'100%', padding:'0.75rem', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:'0.5rem'}} required value={formData.orden_dia} onChange={e => setFormData({...formData, orden_dia: e.target.value})}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asistencia */}
      {asistenciaModal.show && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '600px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column'}}>
            <div className="modal-header">
              <h3 className="modal-title">Control de Asistencia - {asistenciaModal.asamblea.tipo}</h3>
              <button className="modal-close" onClick={() => setAsistenciaModal({show: false, asamblea: null})}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem' }}>
              <strong style={{color: '#ef4444'}}>Atención:</strong> Guardar a un afiliado como "Falta" le generará automáticamente una multa financiera.
            </div>

            <div className="modal-body" style={{overflowY: 'auto', flex: 1, padding: 0}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead style={{position: 'sticky', top: 0, background: 'var(--surface-color)'}}>
                  <tr>
                    <th style={{padding: '1rem'}}>Afiliado</th>
                    <th style={{padding: '1rem'}}>Estado de Asistencia</th>
                  </tr>
                </thead>
                <tbody>
                  {afiliados.map(a => (
                    <tr key={a.id_afiliado} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                      <td style={{padding: '1rem'}} className="font-medium">{a.numero_afiliado} - {a.perfiles?.nombres}</td>
                      <td style={{padding: '1rem'}}>
                        <select 
                          style={{
                            padding: '0.5rem', width: '100%', 
                            borderColor: asistenciaList[a.id_afiliado] === 'Falta' ? '#ef4444' : 
                                         asistenciaList[a.id_afiliado] === 'Presente' ? '#10b981' : 'rgba(255,255,255,0.2)'
                          }}
                          value={asistenciaList[a.id_afiliado]}
                          onChange={(e) => setAsistenciaList({...asistenciaList, [a.id_afiliado]: e.target.value})}
                        >
                          <option value="Presente">Presente</option>
                          <option value="Falta">Falta (Multa)</option>
                          <option value="Licencia">Licencia</option>
                          <option value="Atraso">Atraso</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer" style={{borderTop: '1px solid rgba(255,255,255,0.1)'}}>
              <button className="btn btn-outline" onClick={() => setAsistenciaModal({show: false, asamblea: null})}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveAsistencia}>Guardar Asistencia y Multas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Asambleas;
