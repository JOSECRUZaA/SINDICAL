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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('asambleas').select('*').order('fecha', { ascending: false });
    if (!error) setAsambleas(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Separar fecha_hora en fecha y hora para la BD
    const [fechaStr, horaStr] = formData.fecha_hora.split('T');
    
    const dataToInsert = {
      tipo: formData.tipo,
      fecha: fechaStr,
      hora: horaStr,
      lugar: formData.lugar,
      orden_dia: formData.orden_dia,
      estado: 'Programada'
    };

    const { error } = await supabase.from('asambleas').insert([dataToInsert]);
    if (!error) {
      setShowModal(false);
      setFormData({ tipo: 'Ordinaria', fecha_hora: '', lugar: '', orden_dia: '' });
      fetchData();
    } else alert('Error: ' + error.message);
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
                  <th>Acciones</th>
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
                      <button className="btn-outline" style={{padding: '0.25rem 0.5rem', border: 'none'}} title="Tomar Asistencia">
                        <Users size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
    </div>
  );
};
export default Asambleas;
