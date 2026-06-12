import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, X, Edit, Trash2, Eye, User, Lock, Mail, CreditCard } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './Afiliados.css';

const Afiliados = () => {
  const [afiliados, setAfiliados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // 360 View State
  const [selectedAfiliado, setSelectedAfiliado] = useState(null);
  const [vehiculos360, setVehiculos360] = useState([]);
  const [obligaciones360, setObligaciones360] = useState([]);
  const [directiva360, setDirectiva360] = useState([]);
  const [loading360, setLoading360] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    numero_afiliado: '', ci: '', nombres: '', paterno: '', materno: '',
    tipo_afiliado: 'Socio Propietario', id_categoria_licencia: '', id_perfil: '',
    estado_organico: 'Pendiente', fecha_ingreso: new Date().toISOString().split('T')[0],
    crear_cuenta_web: false, correo: '', password: ''
  });

  useEffect(() => {
    fetchData();
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setSelectedAfiliado(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener categorías
      const { data: catData, error: catError } = await supabase.from('categorias_licencia').select('*');
      if (catError) {
        alert('Error cargando categorías: ' + catError.message);
      }
      if (catData) {
        setCategorias(catData);
      }

      // Obtener perfiles para vincular
      const { data: perfData, error: perfError } = await supabase.from('perfiles').select('*');
      if (!perfError && perfData) {
        setPerfiles(perfData);
      }

      // Obtener afiliados
      const { data: afData, error } = await supabase
        .from('afiliados')
        .select(`
          *,
          categorias_licencia(categoria),
          perfiles(nombres, paterno)
        `)
        .order('id_afiliado', { ascending: false });
        
      if (error) throw error;
      setAfiliados(afData || []);
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

  const handlePerfilChange = (e) => {
    const selectedId = e.target.value;
    const selectedProfile = perfiles.find(p => p.id_perfil.toString() === selectedId);
    
    setFormData(prev => ({
      ...prev,
      id_perfil: selectedId,
      // Auto-completar CI si se selecciona un perfil y el campo actual está vacío o queremos sobreescribirlo
      ci: selectedProfile ? (selectedProfile.ci || prev.ci) : prev.ci
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let final_id_perfil = formData.id_perfil || null;

      if (!editingId && !formData.id_perfil) {
        // Estamos creando un afiliado nuevo SIN vincularlo a un perfil existente
        // Por lo tanto, debemos crearle un perfil físico
        if (formData.crear_cuenta_web) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const tempClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });

          const { data: authData, error: authError } = await tempClient.auth.signUp({
            email: formData.correo,
            password: formData.password,
            options: { data: { nombres: formData.nombres, ci: formData.ci } }
          });

          if (authError) throw authError;

          // Reintentos para esperar que el trigger de Supabase cree el perfil
          let perfData = null;
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo por intento
            
            const { data, error } = await supabase.from('perfiles')
              .update({ paterno: formData.paterno, materno: formData.materno, ci: formData.ci, nombres: formData.nombres })
              .eq('auth_user_id', authData.user.id)
              .select('id_perfil');
              
            if (data && data.length > 0) {
              perfData = data[0];
              break;
            }
          }
          
          if (!perfData) {
            throw new Error("El sistema está tardando en crear el perfil en la base de datos (Trigger Auth). Inténtalo de nuevo o revisa si se creó en la lista.");
          }
          final_id_perfil = perfData.id_perfil;
        } else {
          // Crear perfil manual sin cuenta auth
          const { data: perfData, error: profileError } = await supabase.from('perfiles')
            .insert([{ nombres: formData.nombres, paterno: formData.paterno, materno: formData.materno, ci: formData.ci, rol: 'Afiliado' }])
            .select('id_perfil').single();
          if (profileError) throw profileError;
          final_id_perfil = perfData.id_perfil;
        }
      }

      const payload = {
        numero_afiliado: formData.numero_afiliado,
        tipo_afiliado: formData.tipo_afiliado,
        id_categoria_licencia: formData.id_categoria_licencia || null,
        id_perfil: final_id_perfil,
        estado_organico: formData.estado_organico,
        fecha_ingreso: formData.fecha_ingreso
      };

      if (editingId) {
        const { error } = await supabase.from('afiliados').update(payload).eq('id_afiliado', editingId);
        if (error) throw error;
      } else {
        const { data: newAfiliado, error } = await supabase.from('afiliados').insert([payload]).select('id_afiliado').single();
        if (error) throw error;

        // Generar Cuota de Ingreso Automáticamente
        const { data: cuotaIngreso } = await supabase.from('tipos_cuota').select('*').eq('nombre', 'Cuota de Ingreso').single();
        if (cuotaIngreso) {
          await supabase.from('obligaciones_financieras').insert([{
            id_afiliado: newAfiliado.id_afiliado,
            id_tipo_cuota: cuotaIngreso.id_tipo_cuota,
            tipo_obligacion: 'Cuota',
            concepto: 'Cuota de Ingreso',
            monto_total: cuotaIngreso.monto_default,
            fecha_limite: new Date().toISOString().split('T')[0],
            estado: 'Pendiente'
          }]);
        }
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({
        numero_afiliado: '', ci: '', nombres: '', paterno: '', materno: '',
        tipo_afiliado: 'Socio Propietario', id_categoria_licencia: '', id_perfil: '',
        estado_organico: 'Pendiente', fecha_ingreso: new Date().toISOString().split('T')[0],
        crear_cuenta_web: false, correo: '', password: ''
      });
      fetchData();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
  };

  const handleEditClick = (afiliado) => {
    setFormData({
      numero_afiliado: afiliado.numero_afiliado || '', ci: '', nombres: '', paterno: '', materno: '',
      tipo_afiliado: afiliado.tipo_afiliado || 'Socio Propietario',
      id_categoria_licencia: afiliado.id_categoria_licencia || '',
      id_perfil: afiliado.id_perfil || '',
      estado_organico: afiliado.estado_organico || 'Activo',
      fecha_ingreso: afiliado.fecha_ingreso ? afiliado.fecha_ingreso.split('T')[0] : new Date().toISOString().split('T')[0],
      crear_cuenta_web: false, correo: '', password: ''
    });
    setEditingId(afiliado.id_afiliado);
    setShowModal(true);
  };

  const filteredAfiliados = afiliados.filter(a => 
    a.numero_afiliado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tipo_afiliado?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unlinkedProfiles = perfiles.filter(p => {
    // Mostrar si es el perfil que ya tiene asignado actualmente (para no perderlo al editar)
    if (editingId && formData.id_perfil && formData.id_perfil.toString() === p.id_perfil.toString()) {
      return true;
    }
    // Mostrar solo si no está en la lista de afiliados
    return !afiliados.some(a => a.id_perfil === p.id_perfil);
  });

  const getBadgeClass = (estado) => {
    switch(estado) {
      case 'Activo': return 'badge-success';
      case 'Suspendido': return 'badge-warning';
      case 'Retirado': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const handleOpen360 = async (afiliado) => {
    setSelectedAfiliado(afiliado);
    setLoading360(true);
    
    // Fetch vehicles
    const { data: vData } = await supabase.from('vehiculos').select('*').eq('id_propietario', afiliado.id_afiliado);
    setVehiculos360(vData || []);
    
    // Fetch obligations
    const { data: oData } = await supabase.from('obligaciones_financieras')
      .select('*, tipos_cuota(nombre), tipos_multa(concepto)')
      .eq('id_afiliado', afiliado.id_afiliado);
    setObligaciones360(oData || []);
    
    // Fetch directiva
    const { data: dData } = await supabase.from('directiva')
      .select('*, cargos_directiva(nombre_cargo)')
      .eq('id_afiliado', afiliado.id_afiliado)
      .order('gestion_inicio', { ascending: false });
    setDirectiva360(dData || []);
    
    setLoading360(false);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Directorio de Afiliados</h2>
          <p className="text-muted">Gestión de socios propietarios, choferes y relevos.</p>
        </div>
        <div className="actions-group">
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setFormData({
              numero_afiliado: '', ci: '', nombres: '', paterno: '', materno: '',
              tipo_afiliado: 'Socio Propietario', id_categoria_licencia: '', id_perfil: '',
              estado_organico: 'Pendiente', fecha_ingreso: new Date().toISOString().split('T')[0],
              crear_cuenta_web: false, correo: '', password: ''
            });
            setShowModal(true);
          }}>
            <Plus size={18} /> Nuevo Afiliado
          </button>
        </div>
      </div>

      <div className="glass-table-container">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por número o tipo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div>
          ) : filteredAfiliados.length === 0 ? (
            <div className="empty-state">No se encontraron afiliados registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>N° Afiliado</th>
                  <th>Nombre Usuario (Perfil)</th>
                  <th>Tipo</th>
                  <th>Categoría Licencia</th>
                  <th>Fecha Ingreso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAfiliados.map(afiliado => (
                  <tr key={afiliado.id_afiliado}>
                    <td className="font-medium text-white">{afiliado.numero_afiliado}</td>
                    <td>
                      {afiliado.perfiles 
                        ? `${afiliado.perfiles.nombres} ${afiliado.perfiles.paterno || ''}` 
                        : <span className="badge badge-warning" style={{fontSize: '0.7rem'}}>Sin vincular</span>}
                    </td>
                    <td>{afiliado.tipo_afiliado}</td>
                    <td>{afiliado.categorias_licencia?.categoria || '-'}</td>
                    <td>{new Date(afiliado.fecha_ingreso).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${getBadgeClass(afiliado.estado_organico)}`}>
                        {afiliado.estado_organico}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-outline" 
                        style={{padding: '0.25rem 0.5rem', marginRight: '0.5rem', border: 'none', color: 'var(--secondary-color)'}}
                        onClick={() => handleOpen360(afiliado)}
                        title="Ver Ficha 360°"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="btn-outline" 
                        style={{padding: '0.25rem 0.5rem', border: 'none'}} 
                        title="Editar"
                        onClick={() => handleEditClick(afiliado)}
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Nuevo Afiliado */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Afiliado' : 'Registrar Nuevo Afiliado'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Número de Padrón / Afiliado</label>
                    <input 
                      type="text" 
                      name="numero_afiliado" 
                      value={formData.numero_afiliado}
                      onChange={handleInputChange}
                      placeholder={editingId ? '' : "Auto-asignado por el sistema"}
                      disabled={!editingId} /* Solo lectura si es nuevo */
                      style={!editingId ? {backgroundColor: 'var(--border-color)', color: 'var(--text-muted)'} : {}}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Vincular con Perfil Existente</label>
                    <select name="id_perfil" value={formData.id_perfil || ''} onChange={handlePerfilChange}>
                      <option value="">+ Crear Perfil Físico Nuevo...</option>
                      {unlinkedProfiles.map(p => (
                        <option key={p.id_perfil} value={p.id_perfil}>
                          {p.nombres} {p.paterno || ''} ({p.rol})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!formData.id_perfil && !editingId && (
                    <div className="form-group full-width" style={{ padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group full-width" style={{marginBottom: 0}}>
                        <h4 style={{fontSize: '0.9rem', color: 'var(--primary-color)'}}>Datos del Nuevo Perfil Físico</h4>
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">Nombres Completos</label>
                        <input type="text" name="nombres" required value={formData.nombres} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Apellido Paterno</label>
                        <input type="text" name="paterno" value={formData.paterno} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Apellido Materno</label>
                        <input type="text" name="materno" value={formData.materno} onChange={handleInputChange} />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">Cédula de Identidad (CI)</label>
                        <input type="text" name="ci" required value={formData.ci} onChange={handleInputChange} placeholder="Ej. 1234567-LP" />
                      </div>
                      
                      <div className="form-group full-width" style={{ marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                          <input type="checkbox" checked={formData.crear_cuenta_web} onChange={e => setFormData({...formData, crear_cuenta_web: e.target.checked})} style={{ width: '1.2rem', height: '1.2rem' }} />
                          Crear cuenta de acceso web ahora mismo
                        </label>
                      </div>

                      {formData.crear_cuenta_web && (
                         <div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px' }}>
                           <div className="form-group">
                             <label className="form-label">Correo Electrónico</label>
                             <input type="email" name="correo" required={formData.crear_cuenta_web} value={formData.correo} onChange={handleInputChange} />
                           </div>
                           <div className="form-group">
                             <label className="form-label">Contraseña Temporal</label>
                             <input type="text" name="password" required={formData.crear_cuenta_web} minLength={6} value={formData.password} onChange={handleInputChange} />
                           </div>
                         </div>
                      )}
                    </div>
                  )}

                  {/* Si edita, o si vinculó perfil, solo mostrar el CI info */}
                  {(formData.id_perfil || editingId) && (
                    <div className="form-group">
                      <label className="form-label">Cédula de Identidad (CI Vinculado)</label>
                      <input type="text" name="ci" value={formData.ci} onChange={handleInputChange} disabled style={{backgroundColor: 'var(--border-color)', color: 'var(--text-muted)'}} />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label className="form-label">Tipo de Afiliado</label>
                    <select name="tipo_afiliado" value={formData.tipo_afiliado} onChange={handleInputChange}>
                      <option value="Socio Propietario">Socio Propietario</option>
                      <option value="Chofer Asalariado">Chofer Asalariado</option>
                      <option value="Relevo">Relevo</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Categoría de Licencia</label>
                    <select name="id_categoria_licencia" value={formData.id_categoria_licencia} onChange={handleInputChange}>
                      <option value="">Seleccione categoría...</option>
                      {categorias.map(cat => (
                        <option key={cat.id_categoria} value={cat.id_categoria}>
                          Categoría {cat.categoria} - {cat.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado Orgánico</label>
                    <select name="estado_organico" value={formData.estado_organico} onChange={handleInputChange}>
                      <option value="Pendiente">Pendiente (Alta)</option>
                      <option value="Activo">Activo</option>
                      <option value="Suspendido">Suspendido</option>
                      <option value="Retirado">Retirado</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha de Ingreso</label>
                    <input 
                      type="date" 
                      name="fecha_ingreso" 
                      required 
                      value={formData.fecha_ingreso}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha 360 */}
      {selectedAfiliado && (
        <div className="modal-overlay" onClick={() => setSelectedAfiliado(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '900px'}}>
            <div className="modal-header">
              <h3 className="modal-title">Ficha Única 360°: {selectedAfiliado.numero_afiliado}</h3>
              <button className="modal-close" onClick={() => setSelectedAfiliado(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{background: 'var(--bg-color)'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                
                {/* Info Básica */}
                <div className="glass-panel" style={{padding: '1.5rem'}}>
                  <h4 style={{color: 'var(--primary-color)', marginBottom: '1rem'}}>Datos Sindicales</h4>
                  <p><strong>Tipo:</strong> {selectedAfiliado.tipo_afiliado}</p>
                  <p><strong>Cédula:</strong> {selectedAfiliado.ci || 'No registrada'}</p>
                  <p><strong>Categoría:</strong> {selectedAfiliado.categorias_licencia?.categoria || '-'}</p>
                  <p><strong>Estado:</strong> <span className={`badge ${getBadgeClass(selectedAfiliado.estado_organico)}`}>{selectedAfiliado.estado_organico}</span></p>
                  <p><strong>Perfil Web:</strong> {selectedAfiliado.perfiles ? `${selectedAfiliado.perfiles.nombres} ${selectedAfiliado.perfiles.paterno || ''}` : 'No vinculado'}</p>
                </div>

                {/* Vehículos */}
                <div className="glass-panel" style={{padding: '1.5rem'}}>
                  <h4 style={{color: '#3b82f6', marginBottom: '1rem'}}>Parque Automotor</h4>
                  {loading360 ? <div className="spinner"></div> : vehiculos360.length === 0 ? <p className="text-muted">No tiene vehículos registrados.</p> : (
                    <ul style={{listStyle: 'none'}}>
                      {vehiculos360.map(v => (
                        <li key={v.id_vehiculo} style={{padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'}}>
                          Disco <strong>#{v.numero_disco}</strong> - Placa: {v.placa} ({v.estado})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Historial Directiva */}
                <div className="glass-panel" style={{padding: '1.5rem'}}>
                  <h4 style={{color: 'var(--secondary-color)', marginBottom: '1rem'}}>Cargos en Directiva</h4>
                  {loading360 ? <div className="spinner"></div> : directiva360.length === 0 ? <p className="text-muted">Sin historial en directiva.</p> : (
                    <ul style={{listStyle: 'none'}}>
                      {directiva360.map(d => (
                        <li key={d.id_directiva} style={{padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'}}>
                          {d.cargos_directiva?.nombre_cargo} 
                          <span className={`badge ${d.estado === 1 ? 'badge-success' : 'badge-neutral'}`} style={{marginLeft: '0.5rem', fontSize: '0.65rem'}}>
                            {d.estado === 1 ? 'En Funciones' : 'Finalizado'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Estado de Cuenta */}
                <div className="glass-panel" style={{padding: '1.5rem'}}>
                  <h4 style={{color: '#ef4444', marginBottom: '1rem'}}>Estado de Cuenta</h4>
                  {loading360 ? <div className="spinner"></div> : obligaciones360.length === 0 ? <p className="text-muted">Sin deudas pendientes.</p> : (
                    <ul style={{listStyle: 'none', maxHeight: '150px', overflowY: 'auto'}}>
                      {obligaciones360.map(o => (
                        <li key={o.id_obligacion} style={{padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'}}>
                          {o.tipos_cuota?.nombre || o.tipos_multa?.concepto} - <strong>{o.monto_total} Bs</strong>
                          <span className={`badge ${o.estado === 'Pagado' ? 'badge-success' : 'badge-danger'}`} style={{marginLeft: '0.5rem', fontSize: '0.65rem'}}>
                            {o.estado}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Afiliados;
