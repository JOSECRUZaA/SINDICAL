import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, X, Map } from 'lucide-react';

const Rutas = () => {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    numero_ruta: '', nombre_ruta: '', origen: '', destino: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('rutas').select('*').order('id_ruta');
    if (!error) setRutas(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('rutas').insert([formData]);
    if (!error) {
      setShowModal(false);
      setFormData({ numero_ruta: '', nombre_ruta: '', origen: '', destino: '' });
      fetchData();
    } else alert('Error: ' + error.message);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gestión de Rutas</h2>
          <p className="text-muted">Administración de recorridos y líneas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nueva Ruta
        </button>
      </div>

      <div className="glass-table-container">
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div> : (
            <table>
              <thead>
                <tr>
                  <th>Nº Línea</th>
                  <th>Nombre Comercial</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rutas.map(r => (
                  <tr key={r.id_ruta}>
                    <td className="font-medium text-white">{r.numero_ruta}</td>
                    <td>{r.nombre_ruta}</td>
                    <td>{r.origen}</td>
                    <td>{r.destino}</td>
                    <td><span className={`badge ${r.estado === 1 ? 'badge-success' : 'badge-danger'}`}>
                      {r.estado === 1 ? 'Activa' : 'Inactiva'}
                    </span></td>
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
              <h3 className="modal-title">Registrar Ruta</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Número/Código de Línea</label>
                  <input type="text" required value={formData.numero_ruta} onChange={e => setFormData({...formData, numero_ruta: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre Comercial</label>
                  <input type="text" value={formData.nombre_ruta} onChange={e => setFormData({...formData, nombre_ruta: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Punto de Origen</label>
                  <input type="text" required value={formData.origen} onChange={e => setFormData({...formData, origen: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Punto de Destino</label>
                  <input type="text" required value={formData.destino} onChange={e => setFormData({...formData, destino: e.target.value})} />
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
export default Rutas;
