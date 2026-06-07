import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, X, Edit, Bus, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Vehiculos = () => {
  const { profile } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [afiliados, setAfiliados] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [choferModal, setChoferModal] = useState({ show: false, vehiculo: null });
  const [choferFormData, setChoferFormData] = useState({ id_chofer: '' });
  
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
          afiliados (numero_afiliado, perfiles(nombres))
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

      if (error) throw error;
      
      setShowModal(false);
      setFormData({
        numero_disco: '', placa: '', numero_linea: '', marca: '', modelo: '', color: '', estado: 'Operativo', id_propietario: ''
      });
      fetchData();
    } catch (error) {
      alert('Error al guardar vehículo: ' + error.message);
    }
  };

  const handleAssignChofer = async (e) => {
    e.preventDefault();
    if (!choferFormData.id_chofer) return;

    try {
      const { error } = await supabase.from('chofer_vehiculo').insert([{
        id_vehiculo: choferModal.vehiculo.id_vehiculo,
        id_afiliado: parseInt(choferFormData.id_chofer),
        fecha_asignacion: new Date().toISOString().split('T')[0],
        estado: 1
      }]);

      if (error) throw error;
      
      alert('Chofer asignado exitosamente.');
      setChoferModal({ show: false, vehiculo: null });
      setChoferFormData({ id_chofer: '' });
      // fetchData() // no es estrictamente necesario ya que la tabla muestra propietarios, no choferes
    } catch (error) {
      alert('Error al asignar chofer: ' + error.message);
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
                    <td>{v.afiliados?.perfiles?.nombres || v.afiliados?.numero_afiliado || 'Sin Asignar'}</td>
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
                <div className="form-group full-width">
                  <label className="form-label">Seleccione el Chofer</label>
                  <select required value={choferFormData.id_chofer} onChange={e => setChoferFormData({ id_chofer: e.target.value })}>
                    <option value="">Seleccione un afiliado/chofer...</option>
                    {afiliados.map(a => (
                      // Excluir al propietario actual de la lista para no redundar
                      a.id_afiliado !== choferModal.vehiculo.id_propietario && (
                        <option key={a.id_afiliado} value={a.id_afiliado}>
                          {a.numero_afiliado} - {a.perfiles?.nombres}
                        </option>
                      )
                    ))}
                  </select>
                </div>
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
