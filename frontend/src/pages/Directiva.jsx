import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Award } from 'lucide-react';

const Directiva = () => {
  const [directiva, setDirectiva] = useState([]);
  const [afiliados, setAfiliados] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    id_afiliado: '', id_cargo: '', gestion_inicio: '', gestion_fin: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: afData } = await supabase.from('afiliados').select('id_afiliado, numero_afiliado, perfiles(nombres)');
    if (afData) setAfiliados(afData);

    const { data: cargosData } = await supabase.from('cargos_directiva').select('*').order('orden_jerarquico');
    if (cargosData) setCargos(cargosData);

    const { data, error } = await supabase
      .from('directiva')
      .select('*, afiliados(numero_afiliado, perfiles(nombres)), cargos_directiva(nombre_cargo)')
      .order('gestion_inicio', { ascending: false });
      
    if (!error) setDirectiva(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      id_afiliado: parseInt(formData.id_afiliado),
      id_cargo: parseInt(formData.id_cargo),
      gestion_inicio: formData.gestion_inicio,
      gestion_fin: formData.gestion_fin || null
    };

    const { error } = await supabase.from('directiva').insert([payload]);
    if (!error) {
      setShowModal(false);
      setFormData({ id_afiliado: '', id_cargo: '', gestion_inicio: '', gestion_fin: '' });
      fetchData();
    } else alert('Error: ' + error.message);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Directiva Sindical</h2>
          <p className="text-muted">Registro histórico y actual de la mesa directiva.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Asignar Cargo
        </button>
      </div>

      <div className="glass-table-container">
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div> : (
            <table>
              <thead>
                <tr>
                  <th>Cargo</th>
                  <th>Directivo (Afiliado)</th>
                  <th>Gestión Inicio</th>
                  <th>Gestión Fin</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {directiva.map(d => (
                  <tr key={d.id_directiva}>
                    <td className="font-medium text-white"><Award size={16} style={{display:'inline', marginRight:'0.5rem', color:'var(--primary-color)'}}/> {d.cargos_directiva?.nombre_cargo}</td>
                    <td>{d.afiliados?.perfiles?.nombres} ({d.afiliados?.numero_afiliado})</td>
                    <td>{new Date(d.gestion_inicio).toLocaleDateString()}</td>
                    <td>{d.gestion_fin ? new Date(d.gestion_fin).toLocaleDateString() : 'Vigente'}</td>
                    <td><span className={`badge ${d.estado === 1 ? 'badge-success' : 'badge-neutral'}`}>{d.estado === 1 ? 'En Funciones' : 'Ex-Directivo'}</span></td>
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
              <h3 className="modal-title">Asignar Cargo Directivo</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Cargo</label>
                  <select required value={formData.id_cargo} onChange={e => setFormData({...formData, id_cargo: e.target.value})}>
                    <option value="">Seleccione cargo...</option>
                    {cargos.map(c => <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_cargo}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Directivo (Afiliado)</label>
                  <select required value={formData.id_afiliado} onChange={e => setFormData({...formData, id_afiliado: e.target.value})}>
                    <option value="">Seleccione afiliado...</option>
                    {afiliados.map(a => <option key={a.id_afiliado} value={a.id_afiliado}>{a.numero_afiliado} - {a.perfiles?.nombres}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Posesión (Inicio)</label>
                  <input type="date" required value={formData.gestion_inicio} onChange={e => setFormData({...formData, gestion_inicio: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Cese (Fin - Opcional)</label>
                  <input type="date" value={formData.gestion_fin} onChange={e => setFormData({...formData, gestion_fin: e.target.value})} />
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
export default Directiva;
