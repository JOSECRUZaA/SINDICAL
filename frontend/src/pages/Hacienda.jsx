import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, DollarSign, CheckCircle } from 'lucide-react';

const Hacienda = () => {
  const [obligaciones, setObligaciones] = useState([]);
  const [afiliados, setAfiliados] = useState([]);
  const [tiposCuota, setTiposCuota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    id_afiliado: '',
    tipo_obligacion: 'Cuota',
    id_tipo_cuota: '',
    concepto: '',
    monto_total: '',
    fecha_limite: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Traer afiliados para el select
    const { data: afData } = await supabase.from('afiliados').select('id_afiliado, numero_afiliado, perfiles(nombres)');
    if (afData) setAfiliados(afData);

    // Traer tipos de cuota
    const { data: cuotasData } = await supabase.from('tipos_cuota').select('*');
    if (cuotasData) setTiposCuota(cuotasData);

    // Traer obligaciones
    const { data, error } = await supabase
      .from('obligaciones_financieras')
      .select('*, afiliados(numero_afiliado, perfiles(nombres))')
      .order('fecha_limite', { ascending: false });
      
    if (!error) setObligaciones(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let conceptoGuardar = formData.concepto;
    
    // Si seleccionó un tipo de cuota predefinido, usar ese nombre en el concepto
    if (formData.tipo_obligacion === 'Cuota' && formData.id_tipo_cuota) {
        const cuotaSelec = tiposCuota.find(t => t.id_tipo_cuota.toString() === formData.id_tipo_cuota.toString());
        if (cuotaSelec && !conceptoGuardar) {
            conceptoGuardar = cuotaSelec.nombre;
        }
    }

    const { error } = await supabase.from('obligaciones_financieras').insert([{
        ...formData,
        id_tipo_cuota: formData.id_tipo_cuota ? parseInt(formData.id_tipo_cuota) : null,
        concepto: conceptoGuardar
    }]);
    
    if (!error) {
      setShowModal(false);
      setFormData({ id_afiliado: '', tipo_obligacion: 'Cuota', id_tipo_cuota: '', concepto: '', monto_total: '', fecha_limite: '' });
      fetchData();
    } else alert('Error: ' + error.message);
  };

  const handleTipoCuotaChange = (e) => {
    const id = e.target.value;
    const cuota = tiposCuota.find(t => t.id_tipo_cuota.toString() === id);
    setFormData({
        ...formData, 
        id_tipo_cuota: id, 
        monto_total: cuota ? cuota.monto_default : '',
        concepto: cuota ? cuota.nombre : ''
    });
  };

  const marcarPagado = async (id) => {
    const { error } = await supabase
      .from('obligaciones_financieras')
      .update({ estado: 'Pagado', fecha_pago: new Date().toISOString() })
      .eq('id_obligacion', id);
    if (!error) fetchData();
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Hacienda y Finanzas</h2>
          <p className="text-muted">Control de cuotas, multas y aportes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Cargar Obligación
        </button>
      </div>

      <div className="stats-grid" style={{marginBottom: '1rem'}}>
        <div className="stat-card">
          <div className="stat-icon" style={{color: 'var(--secondary-color)'}}><DollarSign size={28} /></div>
          <div className="stat-info"><div className="stat-label">Deuda Total Pendiente</div><div className="stat-value text-warning">Bs {obligaciones.filter(o => o.estado === 'Pendiente').reduce((acc, curr) => acc + Number(curr.monto_total), 0).toFixed(2)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{color: '#10b981'}}><CheckCircle size={28} /></div>
          <div className="stat-info"><div className="stat-label">Total Recaudado</div><div className="stat-value text-success">Bs {obligaciones.filter(o => o.estado === 'Pagado').reduce((acc, curr) => acc + Number(curr.monto_pagado || curr.monto_total), 0).toFixed(2)}</div></div>
        </div>
      </div>

      <div className="glass-table-container">
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div> : (
            <table>
              <thead>
                <tr>
                  <th>Afiliado</th>
                  <th>Tipo</th>
                  <th>Concepto</th>
                  <th>Monto (Bs)</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {obligaciones.map(o => (
                  <tr key={o.id_obligacion}>
                    <td className="font-medium text-white">{o.afiliados?.perfiles?.nombres || o.afiliados?.numero_afiliado}</td>
                    <td>{o.tipo_obligacion}</td>
                    <td>{o.concepto}</td>
                    <td className="font-bold">{o.monto_total}</td>
                    <td>{new Date(o.fecha_limite).toLocaleDateString()}</td>
                    <td><span className={`badge ${o.estado === 'Pagado' ? 'badge-success' : 'badge-danger'}`}>{o.estado}</span></td>
                    <td>
                      {o.estado === 'Pendiente' && (
                        <button className="btn btn-primary" style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}} onClick={() => marcarPagado(o.id_obligacion)}>
                          Cobrar
                        </button>
                      )}
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
              <h3 className="modal-title">Cargar Cuota / Multa</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Afiliado</label>
                  <select required value={formData.id_afiliado} onChange={e => setFormData({...formData, id_afiliado: e.target.value})}>
                    <option value="">Seleccione afiliado...</option>
                    {afiliados.map(a => <option key={a.id_afiliado} value={a.id_afiliado}>{a.numero_afiliado} - {a.perfiles?.nombres}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select required value={formData.tipo_obligacion} onChange={e => setFormData({...formData, tipo_obligacion: e.target.value})}>
                    <option value="Cuota">Cuota</option>
                    <option value="Aporte Especial">Aporte Especial</option>
                  </select>
                </div>
                {formData.tipo_obligacion === 'Cuota' && tiposCuota.length > 0 && (
                  <div className="form-group full-width">
                    <label className="form-label">Clase de Cuota</label>
                    <select value={formData.id_tipo_cuota} onChange={handleTipoCuotaChange}>
                      <option value="">Otra Cuota / Manual...</option>
                      {tiposCuota.map(t => <option key={t.id_tipo_cuota} value={t.id_tipo_cuota}>{t.nombre} ({t.monto_default} Bs)</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Monto (Bs)</label>
                  <input type="number" step="0.01" required value={formData.monto_total} onChange={e => setFormData({...formData, monto_total: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Concepto (Descripción)</label>
                  <input type="text" required value={formData.concepto} onChange={e => setFormData({...formData, concepto: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Fecha de Vencimiento</label>
                  <input type="date" required value={formData.fecha_limite} onChange={e => setFormData({...formData, fecha_limite: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Deuda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Hacienda;
