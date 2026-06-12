import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, X, UserPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showConfirmDelete, showError, showAlert, showSuccessToast } from '../lib/alerts';

const Vehiculos = () => {
  const { profile } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [afiliados, setAfiliados] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [choferModal, setChoferModal] = useState({ show: false, vehiculo: null });
  const [isExterno, setIsExterno] = useState(false);
  const [choferFormData, setChoferFormData] = useState({ 
    id_chofer: '',
    nombres_ext: '', paterno_ext: '', materno_ext: '', ci_ext: '', licencia_ext: '', telefono_ext: ''
  });
  
  const [formData, setFormData] = useState({
    numero_disco: '',
    placa: '',
    numero_linea: '',
    marca: '',
    modelo: '',
    color: '',
    estado: 'Operativo',
    id_propietario: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: afData } = await supabase.from('afiliados').select('id_afiliado, numero_afiliado, perfiles(nombres)');
      if (afData) setAfiliados(afData);

      const { data: rutasData, error: rutasError } = await supabase.from('rutas').select('numero_ruta, nombre_ruta').order('numero_ruta', { ascending: true });
      if (rutasError) console.error("Error cargando rutas:", rutasError);
      if (rutasData) setRutas(rutasData);

      const { data: vhData, error } = await supabase
        .from('vehiculos')
        .select(`
          *,
          afiliados (numero_afiliado, perfiles(nombres, paterno)),
          chofer_vehiculo (
            id_chofer,
            id_chofer_externo,
            estado,
            afiliados (numero_afiliado, perfiles(nombres, paterno)),
            choferes_externos (nombres, paterno, ci)
          )
        `)
        .order('numero_disco', { ascending: true });
        
      if (error) throw error;
      setVehiculos(vhData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('vehiculos')
        .insert([{
          numero_disco: parseInt(formData.numero_disco),
          placa: formData.placa,
          numero_linea: formData.numero_linea,
          marca: formData.marca,
          modelo: formData.modelo,
          color: formData.color,
          estado: formData.estado,
          id_propietario: formData.id_propietario || null
        }]);

      if (error) {
        showError('Error al guardar vehículo: ' + error.message);
      } else {
        setShowModal(false);
        setFormData({
          numero_disco: '', placa: '', numero_linea: '', marca: '', modelo: '', color: '', estado: 'Operativo', id_propietario: ''
        });
        fetchData();
        showSuccessToast('Vehículo guardado');
      }
    } catch (error) {
      showError('Error al procesar la solicitud: ' + error.message);
    }
  };

  const handleDelete = async (id_vehiculo) => {
    const isConfirmed = await showConfirmDelete('¿Eliminar Vehículo?', 'Esta acción no se puede deshacer.');
    if (isConfirmed) {
      try {
        const { error } = await supabase.from('vehiculos').delete().eq('id_vehiculo', id_vehiculo);
        if (error) {
          if (error.code === '23503') {
            showError('No se puede eliminar este vehículo porque tiene choferes asignados u otros datos vinculados. Primero debe desvincularlos.');
          } else {
            showError('Error al eliminar: ' + error.message);
          }
        } else {
          fetchData();
          showSuccessToast('Vehículo eliminado');
        }
      } catch (error) {
        console.error('Error al eliminar vehículo:', error);
      }
    }
  };

  const handleAssignChofer = async (e) => {
    e.preventDefault();
    try {
      let error = null;
      if (isExterno) {
        if (!choferFormData.nombres_ext || !choferFormData.ci_ext) {
          showAlert("Datos incompletos", "Nombre y CI son requeridos", "warning");
          return;
        }
        
        const { data: extData, error: extError } = await supabase.from('choferes_externos').insert([{
          nombres: choferFormData.nombres_ext,
          paterno: choferFormData.paterno_ext,
          materno: choferFormData.materno_ext,
          ci: choferFormData.ci_ext,
          licencia: choferFormData.licencia_ext,
          telefono: choferFormData.telefono_ext
        }]).select();
        
        if (extError) throw extError;

        const { error: asignError } = await supabase.from('chofer_vehiculo').insert([{
          id_vehiculo: choferModal.vehiculo.id_vehiculo,
          id_chofer: null,
          id_chofer_externo: extData[0].id_chofer_externo,
          fecha_asignacion: new Date().toISOString().split('T')[0],
          estado: 1
        }]);
        error = asignError;
      } else {
        if (!choferFormData.id_chofer) return;
        const { error: asignError } = await supabase.from('chofer_vehiculo').insert([{
          id_vehiculo: choferModal.vehiculo.id_vehiculo,
          id_chofer: parseInt(choferFormData.id_chofer),
          id_chofer_externo: null,
          fecha_asignacion: new Date().toISOString().split('T')[0],
          estado: 1
        }]);
        error = asignError;
      }
      
      if (!error) {
        setChoferModal({ show: false, vehiculo: null });
        setChoferFormData({ id_chofer: '', nombres_ext: '', paterno_ext: '', materno_ext: '', ci_ext: '', licencia_ext: '', telefono_ext: '' });
        setIsExterno(false);
        fetchData();
        showSuccessToast('Chofer asignado exitosamente');
      } else {
        showError('Error al asignar chofer: ' + error.message);
      }
    } catch (error) {
      showError('Error al asignar chofer: ' + error.message);
    }
  };

  const filtered = vehiculos.filter(v => 
    v.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.numero_disco?.toString().includes(searchTerm)
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Parque Automotor</h2>
          <p className="text-muted">Gestión de vehículos y unidades móviles.</p>
        </div>
        {(profile?.rol === 'Administrador' || profile?.rol === 'Secretario') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Registrar Vehículo
          </button>
        )}
      </div>

      <div className="glass-table-container">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar placa o disco..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No se encontraron vehículos.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Disco</th>
                  <th>Placa</th>
                  <th>Línea</th>
                  <th>Propietario</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id_vehiculo}>
                    <td className="font-medium text-white">Nº {v.numero_disco}</td>
                    <td><span className="badge badge-neutral" style={{letterSpacing:'1px'}}>{v.placa}</span></td>
                    <td>{v.numero_linea}</td>
                    <td>
                      <div style={{fontWeight: 'bold', color: 'var(--text-main)'}}>
                        Prop: {v.afiliados?.perfiles?.nombres} {v.afiliados?.perfiles?.paterno || ''} 
                        <span className="text-muted" style={{fontSize: '0.8rem', marginLeft:'0.3rem'}}>({v.afiliados?.numero_afiliado || 'Sin Asignar'})</span>
                      </div>
                      
                      {v.chofer_vehiculo?.filter(c => c.estado === 1).map(c => (
                        <div key={c.id_chofer || c.id_chofer_externo} style={{fontSize: '0.85rem', color: 'var(--accent-color)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                          <UserPlus size={12} /> 
                          {c.id_chofer ? (
                            <span>Chofer (Socio): {c.afiliados?.perfiles?.nombres} {c.afiliados?.perfiles?.paterno || ''}</span>
                          ) : (
                            <span>Chofer (Externo): {c.choferes_externos?.nombres} {c.choferes_externos?.paterno || ''} <span className="text-muted" style={{marginLeft:'0.25rem'}}>(CI: {c.choferes_externos?.ci})</span></span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td>{v.marca} {v.modelo} <span className="text-muted">({v.color})</span></td>
                    <td>
                      <span className={`badge ${v.estado === 'Operativo' ? 'badge-success' : 'badge-warning'}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td>
                      <button className="btn-outline" style={{padding: '0.25rem 0.5rem', border: '1px solid var(--primary-color)'}} title="Asignar Chofer" onClick={() => setChoferModal({ show: true, vehiculo: v })}>
                        <UserPlus size={16} />
                      </button>
                      {profile?.rol === 'Administrador' && (
                        <button 
                          className="btn-outline" 
                          style={{padding: '0.25rem 0.5rem', border: 'none', color: 'var(--danger-color)', marginLeft: '0.25rem'}} 
                          title="Eliminar"
                          onClick={() => handleDelete(v.id_vehiculo)}
                        >
                          <Trash2 size={16} />
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
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Vehículo</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body form-grid">
                <div className="form-group">
                  <label className="form-label">Número de Disco</label>
                  <input type="number" name="numero_disco" required value={formData.numero_disco} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Placa</label>
                  <input type="text" name="placa" required value={formData.placa} onChange={handleInputChange} placeholder="Ej. ABC1234" />
                </div>
                <div className="form-group">
                  <label className="form-label">Línea Asignada</label>
                  <select name="numero_linea" required value={formData.numero_linea} onChange={handleInputChange}>
                    <option value="">Seleccione línea...</option>
                    {rutas.map(r => (
                      <option key={r.numero_ruta} value={r.numero_ruta}>
                        Línea {r.numero_ruta} - {r.nombre_ruta}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Socio Propietario</label>
                  <select name="id_propietario" value={formData.id_propietario} onChange={handleInputChange}>
                    <option value="">Seleccione propietario...</option>
                    {afiliados.map(a => (
                      <option key={a.id_afiliado} value={a.id_afiliado}>
                        {a.numero_afiliado} - {a.perfiles?.nombres || 'Sin Nombre'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Marca</label>
                  <input type="text" name="marca" value={formData.marca} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Modelo</label>
                  <input type="text" name="modelo" value={formData.modelo} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input type="text" name="color" value={formData.color} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado Inicial</label>
                  <select name="estado" value={formData.estado} onChange={handleInputChange}>
                    <option value="Operativo">Operativo</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Restricción Vehicular">Restricción Vehicular</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Vehículo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Chofer */}
      {choferModal.show && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px'}}>
            <div className="modal-header">
              <h3 className="modal-title">Asignar Chofer Relevo</h3>
              <button className="modal-close" onClick={() => setChoferModal({ show: false, vehiculo: null })}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.9rem' }}>
              Vehículo: <strong>Placa {choferModal.vehiculo.placa}</strong> (Disco {choferModal.vehiculo.numero_disco})
            </div>

            <form onSubmit={handleAssignChofer}>
              <div className="modal-body form-grid">
                <div className="form-group full-width" style={{display: 'flex', gap: '1rem', background: 'var(--surface-color)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="radio" checked={!isExterno} onChange={() => setIsExterno(false)} /> Es Afiliado (Socio)
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="radio" checked={isExterno} onChange={() => setIsExterno(true)} /> Es Chofer Externo
                  </label>
                </div>

                {!isExterno ? (
                  <div className="form-group full-width">
                    <label className="form-label">Seleccione el Chofer Afiliado</label>
                    <select required value={choferFormData.id_chofer} onChange={e => setChoferFormData({...choferFormData, id_chofer: e.target.value })}>
                      <option value="">Seleccione un afiliado...</option>
                      {afiliados.map(a => (
                        a.id_afiliado !== choferModal.vehiculo.id_propietario && (
                          <option key={a.id_afiliado} value={a.id_afiliado}>
                            {a.numero_afiliado} - {a.perfiles?.nombres} {a.perfiles?.paterno}
                          </option>
                        )
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="form-group full-width">
                      <label className="form-label">Nombres Completos</label>
                      <input type="text" required value={choferFormData.nombres_ext} onChange={e => setChoferFormData({...choferFormData, nombres_ext: e.target.value})} placeholder="Nombres del chofer..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ap. Paterno</label>
                      <input type="text" value={choferFormData.paterno_ext} onChange={e => setChoferFormData({...choferFormData, paterno_ext: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ap. Materno</label>
                      <input type="text" value={choferFormData.materno_ext} onChange={e => setChoferFormData({...choferFormData, materno_ext: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">C.I. (Documento)</label>
                      <input type="text" required value={choferFormData.ci_ext} onChange={e => setChoferFormData({...choferFormData, ci_ext: e.target.value})} placeholder="Nº de Carnet" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nº de Licencia</label>
                      <input type="text" value={choferFormData.licencia_ext} onChange={e => setChoferFormData({...choferFormData, licencia_ext: e.target.value})} />
                    </div>
                    <div className="form-group full-width">
                      <label className="form-label">Teléfono / Celular</label>
                      <input type="text" value={choferFormData.telefono_ext} onChange={e => setChoferFormData({...choferFormData, telefono_ext: e.target.value})} />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setChoferModal({ show: false, vehiculo: null })}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Asignar Chofer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehiculos;
