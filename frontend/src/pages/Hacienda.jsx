import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, DollarSign, CheckCircle, Settings, Edit2, Save, Search } from 'lucide-react';

const Hacienda = () => {
  const [obligaciones, setObligaciones] = useState([]);
  const [afiliados, setAfiliados] = useState([]);
  const [tiposCuota, setTiposCuota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [multas, setMultas] = useState([]);
  const [editingConfig, setEditingConfig] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('Pendiente');
  const [filterTipo, setFilterTipo] = useState('Todos');
  
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
    const { data: cuotasData } = await supabase.from('tipos_cuota').select('*').order('id_tipo_cuota');
    if (cuotasData) setTiposCuota(cuotasData);

    // Traer tipos de multa
    const { data: multasData } = await supabase.from('tipos_multa').select('*').order('id_tipo_multa');
    if (multasData) setMultas(multasData);

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

    if (formData.id_afiliado === 'TODOS') {
      // Búsqueda de todos los afiliados activos
      const { data: activos, error: errActivos } = await supabase
        .from('afiliados')
        .select('id_afiliado')
        .eq('estado_organico', 'Activo');
        
      if (errActivos) {
        alert('Error obteniendo afiliados activos: ' + errActivos.message);
        return;
      }
      
      if (!activos || activos.length === 0) {
        alert('No hay afiliados activos para generar esta deuda.');
        return;
      }

      // Crear array gigante con todas las deudas
      const payloads = activos.map(a => ({
        id_afiliado: a.id_afiliado,
        tipo_obligacion: formData.tipo_obligacion,
        id_tipo_cuota: formData.id_tipo_cuota ? parseInt(formData.id_tipo_cuota) : null,
        concepto: conceptoGuardar,
        monto_total: formData.monto_total,
        fecha_limite: formData.fecha_limite,
        estado: 'Pendiente'
      }));

      // Insertar en bloque
      const { error } = await supabase.from('obligaciones_financieras').insert(payloads);
      
      if (!error) {
        alert(`¡Éxito! Se generaron ${payloads.length} deudas correctamente.`);
        setShowModal(false);
        setFormData({ id_afiliado: '', tipo_obligacion: 'Cuota', id_tipo_cuota: '', concepto: '', monto_total: '', fecha_limite: '' });
        fetchData();
      } else {
        alert('Error en carga masiva: ' + error.message);
      }

    } else {
      // Inserción normal de a 1 persona
      const { error } = await supabase.from('obligaciones_financieras').insert([{
          ...formData,
          id_tipo_cuota: formData.id_tipo_cuota ? parseInt(formData.id_tipo_cuota) : null,
          concepto: conceptoGuardar,
          estado: 'Pendiente'
      }]);
      
      if (!error) {
        setShowModal(false);
        setFormData({ id_afiliado: '', tipo_obligacion: 'Cuota', id_tipo_cuota: '', concepto: '', monto_total: '', fecha_limite: '' });
        fetchData();
      } else alert('Error: ' + error.message);
    }
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

  const handleUpdateConfig = async (table, idField, idValue, newMonto) => {
    const { error } = await supabase
      .from(table)
      .update({ monto_default: newMonto })
      .eq(idField, idValue);
      
    if (error) alert('Error al actualizar monto: ' + error.message);
    else {
      setEditingConfig(null);
      fetchData();
    }
  };

  const filteredObligaciones = obligaciones.filter(o => {
    // Búsqueda por texto (Nombre del afiliado o padrón o concepto)
    const textStr = `${o.afiliados?.numero_afiliado || ''} ${o.afiliados?.perfiles?.nombres || ''} ${o.afiliados?.perfiles?.paterno || ''} ${o.concepto || ''}`.toLowerCase();
    const matchSearch = textStr.includes(searchTerm.toLowerCase());
      
    // Filtro por Estado
    const matchEstado = filterEstado === 'Todos' ? true : o.estado === filterEstado;
    
    // Filtro por Tipo
    const matchTipo = filterTipo === 'Todos' ? true : o.tipo_obligacion === filterTipo;
    
    return matchSearch && matchEstado && matchTipo;
  });

  const getTipoBadge = (tipo) => {
    switch(tipo) {
      case 'Cuota': return <span className="badge" style={{background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.2)'}}>Cuota</span>;
      case 'Multa': return <span className="badge badge-danger">Multa</span>;
      case 'Aporte Especial': return <span className="badge badge-warning">Aporte Especial</span>;
      default: return <span className="badge badge-neutral">{tipo}</span>;
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Hacienda y Finanzas</h2>
          <p className="text-muted">Control de cuotas, multas y aportes.</p>
        </div>
        <div className="actions-group" style={{display: 'flex', gap: '0.5rem'}}>
          <button className="btn btn-outline" onClick={() => setShowConfigModal(true)}>
            <Settings size={18} /> Configurar Montos Base
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Cargar Obligación
          </button>
        </div>
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
        <div className="table-controls" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)'}}>
          <div className="search-box" style={{flex: '1 1 300px', position: 'relative'}}>
            <Search className="search-icon" size={18} style={{position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
            <input 
              type="text" 
              placeholder="Buscar por afiliado, N° o concepto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{width: '100%', paddingLeft: '2.5rem'}}
            />
          </div>
          <div style={{display: 'flex', gap: '0.5rem', flex: '1 1 300px'}}>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{flex: 1}}>
              <option value="Todos">Todos los Estados</option>
              <option value="Pendiente">Solo Pendientes</option>
              <option value="Pagado">Solo Pagados</option>
            </select>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{flex: 1}}>
              <option value="Todos">Todos los Tipos</option>
              <option value="Cuota">Cuotas</option>
              <option value="Multa">Multas</option>
              <option value="Aporte Especial">Aportes Especiales</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state"><div className="spinner" style={{borderColor: 'var(--primary-color)', borderTopColor: 'transparent', margin: '0 auto'}}></div><p style={{marginTop: '1rem'}}>Cargando datos...</p></div>
          ) : filteredObligaciones.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron deudas con los filtros actuales.</p>
            </div>
          ) : (
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
                {filteredObligaciones.map(o => (
                  <tr key={o.id_obligacion}>
                    <td>
                      <div style={{fontWeight: '500'}}>{o.afiliados?.perfiles?.nombres} {o.afiliados?.perfiles?.paterno}</div>
                      <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{o.afiliados?.numero_afiliado}</div>
                    </td>
                    <td>{getTipoBadge(o.tipo_obligacion)}</td>
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
          <div className="modal-content" style={{maxWidth: '650px'}}>
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
                    <option value="TODOS" style={{fontWeight: 'bold', color: 'var(--primary-color)', background: 'rgba(0,0,0,0.05)'}}>
                      👥 GENERAR PARA TODOS LOS AFILIADOS ACTIVOS (Masivo)
                    </option>
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

      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h3 className="modal-title">Configuración de Montos Base</h3>
              <button className="modal-close" onClick={() => setShowConfigModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{background: 'var(--bg-color)', padding: '1.5rem'}}>
              
              <h4 style={{marginBottom: '1rem', color: 'var(--primary-color)'}}>Tipos de Cuotas y Aportes</h4>
              <div className="glass-panel" style={{marginBottom: '2rem'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--border-color)', textAlign: 'left'}}>
                      <th style={{padding: '0.5rem'}}>Nombre</th>
                      <th style={{padding: '0.5rem'}}>Periodicidad</th>
                      <th style={{padding: '0.5rem'}}>Monto Base (Bs)</th>
                      <th style={{padding: '0.5rem', textAlign: 'right'}}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiposCuota.map(c => (
                      <tr key={c.id_tipo_cuota} style={{borderBottom: '1px solid var(--border-color)'}}>
                        <td style={{padding: '0.75rem 0.5rem'}}>{c.nombre}</td>
                        <td style={{padding: '0.75rem 0.5rem'}}>{c.periodicidad}</td>
                        <td style={{padding: '0.75rem 0.5rem'}}>
                          {editingConfig?.id === `cuota-${c.id_tipo_cuota}` ? (
                            <input 
                              type="number" 
                              step="0.01" 
                              style={{width: '100px', padding: '0.25rem'}} 
                              value={editingConfig.val} 
                              onChange={e => setEditingConfig({...editingConfig, val: e.target.value})}
                            />
                          ) : (
                            <strong>{c.monto_default}</strong>
                          )}
                        </td>
                        <td style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>
                          {editingConfig?.id === `cuota-${c.id_tipo_cuota}` ? (
                            <button className="btn btn-success" style={{padding: '0.25rem 0.5rem'}} onClick={() => handleUpdateConfig('tipos_cuota', 'id_tipo_cuota', c.id_tipo_cuota, editingConfig.val)}><Save size={16} /></button>
                          ) : (
                            <button className="btn-outline" style={{padding: '0.25rem 0.5rem', border: 'none'}} onClick={() => setEditingConfig({id: `cuota-${c.id_tipo_cuota}`, val: c.monto_default})}><Edit2 size={16} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 style={{marginBottom: '1rem', color: '#ef4444'}}>Tipos de Multas</h4>
              <div className="glass-panel">
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--border-color)', textAlign: 'left'}}>
                      <th style={{padding: '0.5rem'}}>Concepto de Infracción</th>
                      <th style={{padding: '0.5rem'}}>Categoría</th>
                      <th style={{padding: '0.5rem'}}>Monto Base (Bs)</th>
                      <th style={{padding: '0.5rem', textAlign: 'right'}}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multas.map(m => (
                      <tr key={m.id_tipo_multa} style={{borderBottom: '1px solid var(--border-color)'}}>
                        <td style={{padding: '0.75rem 0.5rem'}}>{m.concepto}</td>
                        <td style={{padding: '0.75rem 0.5rem'}}>{m.categoria}</td>
                        <td style={{padding: '0.75rem 0.5rem'}}>
                          {editingConfig?.id === `multa-${m.id_tipo_multa}` ? (
                            <input 
                              type="number" 
                              step="0.01" 
                              style={{width: '100px', padding: '0.25rem'}} 
                              value={editingConfig.val} 
                              onChange={e => setEditingConfig({...editingConfig, val: e.target.value})}
                            />
                          ) : (
                            <strong>{m.monto_default}</strong>
                          )}
                        </td>
                        <td style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>
                          {editingConfig?.id === `multa-${m.id_tipo_multa}` ? (
                            <button className="btn btn-success" style={{padding: '0.25rem 0.5rem'}} onClick={() => handleUpdateConfig('tipos_multa', 'id_tipo_multa', m.id_tipo_multa, editingConfig.val)}><Save size={16} /></button>
                          ) : (
                            <button className="btn-outline" style={{padding: '0.25rem 0.5rem', border: 'none'}} onClick={() => setEditingConfig({id: `multa-${m.id_tipo_multa}`, val: m.monto_default})}><Edit2 size={16} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Hacienda;
