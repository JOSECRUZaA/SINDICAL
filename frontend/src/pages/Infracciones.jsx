import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Search, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showConfirmDelete, showError, showAlert, showSuccessToast } from '../lib/alerts';

const Infracciones = () => {
  const { profile } = useAuth();
  const [multas, setMultas] = useState([]);
  const [tiposMulta, setTiposMulta] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('emitir'); // 'emitir' o 'historial'
  
  // Formulario y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  
  const [formData, setFormData] = useState({
    id_tipo_multa: '',
    monto_total: '',
    observaciones: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Traer catálogo de multas
    const { data: tmData } = await supabase.from('tipos_multa').select('*');
    if (tmData) setTiposMulta(tmData);

    // 2. Traer vehículos con sus dueños para la búsqueda
    const { data: vData } = await supabase
      .from('vehiculos')
      .select('*, afiliados(id_afiliado, numero_afiliado, perfiles(nombres))');
    if (vData) setVehiculos(vData);

    // 3. Traer SOLO multas (obligaciones_financieras)
    const { data: mData } = await supabase
      .from('obligaciones_financieras')
      .select('*, afiliados(numero_afiliado, perfiles(nombres)), tipos_multa(concepto)')
      .eq('tipo_obligacion', 'Multa')
      .order('fecha_registro', { ascending: false });
      
    if (mData) setMultas(mData);
    setLoading(false);
  };

  // Buscador inteligente al teclear
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    
    if (val.length >= 2) {
      const found = vehiculos.find(v => 
        v.placa?.toLowerCase() === val.toLowerCase() || 
        v.numero_disco?.toString() === val
      );
      setSelectedVehiculo(found || null);
    } else {
      setSelectedVehiculo(null);
    }
  };

  // Al seleccionar un tipo de multa, jalar el monto automáticamente
  const handleMultaChange = (e) => {
    const id = e.target.value;
    const tipo = tiposMulta.find(t => t.id_tipo_multa.toString() === id);
    setFormData({
      ...formData,
      id_tipo_multa: id,
      monto_total: tipo ? tipo.monto_default : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehiculo) {
      showAlert('Debe seleccionar un vehículo válido primero.', 'Atención', 'warning');
      return;
    }
    
    const payload = {
      id_afiliado: selectedVehiculo.id_propietario,
      id_tipo_multa: parseInt(formData.id_tipo_multa),
      tipo_obligacion: 'Multa',
      monto_total: parseFloat(formData.monto_total),
      concepto: formData.observaciones || tiposMulta.find(t => t.id_tipo_multa.toString() === formData.id_tipo_multa)?.concepto,
      fecha_limite: new Date().toISOString(), // Se debe pagar inmediatamente o pronto
      estado: 'Pendiente'
    };

    const { error } = await supabase.from('obligaciones_financieras').insert([payload]);
    
    if (!error) {
      setSearchTerm('');
      setSelectedVehiculo(null);
      setFormData({ id_tipo_multa: '', monto_total: '', observaciones: '' });
      fetchData();
      showSuccessToast('Multa procesada');
    } else {
      showError('Error: ' + error.message);
    }
  };

  const handleDelete = async (id_obligacion) => {
    const isConfirmed = await showConfirmDelete('¿Anular Infracción?', 'Esta acción no se puede deshacer.');
    if (isConfirmed) {
      try {
        const { error } = await supabase.from('obligaciones_financieras').delete().eq('id_obligacion', id_obligacion);
        if (error) throw error;
        fetchData();
        showSuccessToast('Infracción anulada');
      } catch (error) {
        showError('Error al eliminar infracción: ' + error.message);
      }
    }
  };

  return (
    <div className="page-container animate-fade-in flex-col h-full">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h2 className="page-title">Control de Infracciones</h2>
          <p className="text-muted">Levanta infracciones en ruta y revisa el historial.</p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('emitir')}
          style={{ 
            background: 'none', border: 'none', padding: '0.75rem 1.5rem', 
            color: activeTab === 'emitir' ? 'var(--primary-color)' : 'var(--text-muted)',
            borderBottom: activeTab === 'emitir' ? '2px solid var(--primary-color)' : '2px solid transparent',
            fontWeight: activeTab === 'emitir' ? 'bold' : 'normal',
            cursor: 'pointer', fontSize: '1rem'
          }}
        >
          Emitir Multa
        </button>
        <button 
          onClick={() => setActiveTab('historial')}
          style={{ 
            background: 'none', border: 'none', padding: '0.75rem 1.5rem', 
            color: activeTab === 'historial' ? 'var(--primary-color)' : 'var(--text-muted)',
            borderBottom: activeTab === 'historial' ? '2px solid var(--primary-color)' : '2px solid transparent',
            fontWeight: activeTab === 'historial' ? 'bold' : 'normal',
            cursor: 'pointer', fontSize: '1rem'
          }}
        >
          Historial de Multas
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        
        {/* PANEL: FORMULARIO RÁPIDO */}
        {activeTab === 'emitir' && (
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '850px', margin: '0 auto' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
              <AlertTriangle size={20} /> Formulario de Infracción
            </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* --- COLUMNA IZQUIERDA: BÚSQUEDA --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Buscador de Placa/Disco */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold' }}>1. Placa o Nº Disco</label>
              <div className="search-box" style={{ width: '100%' }}>
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Ej. ABC1234 o 115" 
                  value={searchTerm} 
                  onChange={handleSearch}
                  autoComplete="off"
                  style={{ textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </div>
            </div>

            {/* Tarjeta del Infractor (Aparece al encontrar) */}
            <div style={{ 
              minHeight: '80px', 
              background: selectedVehiculo ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.02)', 
              border: `1px solid ${selectedVehiculo ? '#10b981' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)', 
              padding: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
            }}>
              {selectedVehiculo ? (
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.25rem' }}>
                    <Check size={16} /> <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>VEHÍCULO ENCONTRADO</span>
                  </div>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedVehiculo.afiliados?.perfiles?.nombres || 'Afiliado ' + selectedVehiculo.afiliados?.numero_afiliado}</p>
                  <p className="text-muted text-sm">Línea {selectedVehiculo.numero_linea} - Disco {selectedVehiculo.numero_disco}</p>
                </div>
              ) : (
                <p className="text-muted text-sm">
                  {searchTerm.length >= 2 ? "No se encontró el vehículo." : "Escriba para buscar un vehículo."}
                </p>
              )}
            </div>
            </div>

            {/* --- COLUMNA DERECHA: MULTA --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>

            {/* Selector de Multa */}
            <div className="form-group" style={{ opacity: selectedVehiculo ? 1 : 0.5, pointerEvents: selectedVehiculo ? 'auto' : 'none' }}>
              <label className="form-label" style={{ fontWeight: 'bold' }}>2. Tipo de Infracción</label>
              <select required value={formData.id_tipo_multa} onChange={handleMultaChange} style={{ fontSize: '1.05rem', padding: '0.75rem' }}>
                <option value="">Seleccione sanción...</option>
                {tiposMulta.map(t => (
                  <option key={t.id_tipo_multa} value={t.id_tipo_multa}>{t.concepto}</option>
                ))}
              </select>
            </div>

            {/* Monto Automático */}
            <div className="form-group" style={{ opacity: selectedVehiculo ? 1 : 0.5, pointerEvents: 'none' }}>
              <label className="form-label" style={{ fontWeight: 'bold' }}>Monto a Cobrar (Bs)</label>
              <input 
                type="text" 
                readOnly 
                value={formData.monto_total ? `${formData.monto_total} Bs` : ''} 
                style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              />
            </div>
            
            {/* Observaciones extra */}
            <div className="form-group" style={{ opacity: selectedVehiculo ? 1 : 0.5, pointerEvents: selectedVehiculo ? 'auto' : 'none' }}>
              <label className="form-label">Observaciones (Opcional)</label>
              <input type="text" placeholder="Ej. Retraso de 5 mins en cruce" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary full-width" 
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                disabled={!selectedVehiculo || !formData.id_tipo_multa}
              >
                PROCESAR MULTA
              </button>
            </div>
            </div>
          </form>
        </div>
        )}

        {/* PANEL: TABLA DE MULTAS */}
        {activeTab === 'historial' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Infracciones Registradas</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
            {loading ? <div className="empty-state"><div className="spinner"></div></div> : (
              <table style={{ width: '100%', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 0' }}>Afiliado / Chofer</th>
                    <th>Infracción</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {multas.map(o => (
                    <tr key={o.id_obligacion} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 0' }} className="font-medium text-white">{o.afiliados?.perfiles?.nombres || o.afiliados?.numero_afiliado}</td>
                      <td>{o.tipos_multa?.concepto || o.concepto}</td>
                      <td className="font-bold text-danger">{o.monto_total} Bs</td>
                      <td>{new Date(o.fecha_registro || o.fecha_limite).toLocaleDateString()}</td>
                      <td><span className={`badge ${o.estado === 'Pagado' ? 'badge-success' : 'badge-danger'}`}>{o.estado}</span></td>
                      <td>
                        {profile?.rol === 'Administrador' && (
                          <button 
                            className="btn-outline" 
                            style={{padding: '0.25rem 0.5rem', border: 'none', color: 'var(--danger-color)'}} 
                            title="Eliminar"
                            onClick={() => handleDelete(o.id_obligacion)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {multas.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted" style={{padding: '3rem'}}>
                        No hay multas registradas en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
        )}

      </div>
    </div>
  );
};
export default Infracciones;
