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
      <div className="page-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>Control de Infracciones</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Levanta infracciones en ruta y revisa el historial.</p>
        </div>

        {/* TABS MODERNOS */}
        <div style={{ 
          display: 'flex', 
          gap: '0.25rem', 
          background: 'var(--surface-color)', 
          padding: '0.35rem', 
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          width: 'fit-content'
        }}>
          <button 
            onClick={() => setActiveTab('emitir')}
            style={{ 
              background: activeTab === 'emitir' ? 'var(--primary-color)' : 'transparent',
              border: 'none', 
              padding: '0.5rem 1rem', 
              color: activeTab === 'emitir' ? 'white' : 'var(--text-muted)',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.3s ease'
            }}
          >
            <AlertTriangle size={16} />
            Emitir Multa
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            style={{ 
              background: activeTab === 'historial' ? 'var(--primary-color)' : 'transparent',
              border: 'none', 
              padding: '0.5rem 1rem', 
              color: activeTab === 'historial' ? 'white' : 'var(--text-muted)',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.3s ease'
            }}
          >
            <Search size={16} />
            Historial
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        
        {/* PANEL: FORMULARIO RÁPIDO */}
        {activeTab === 'emitir' && (
          <div className="glass-panel" style={{ 
            padding: '1.25rem', 
            maxWidth: '1000px', 
            margin: '0 auto',
            borderTop: '4px solid #ef4444',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
            
            {/* --- COLUMNA IZQUIERDA: BÚSQUEDA --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-color)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            
            {/* Buscador de Placa/Disco */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ background: 'var(--primary-color)', color: 'white', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.7rem' }}>1</span>
                Placa o Nº de Disco
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Ej. ABC1234 o 115" 
                  value={searchTerm} 
                  onChange={handleSearch}
                  autoComplete="off"
                  style={{ 
                    width: '100%',
                    padding: '0.6rem 0.6rem 0.6rem 2.25rem',
                    textTransform: 'uppercase', 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-color)',
                    color: 'var(--text-main)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* Tarjeta del Infractor (Aparece al encontrar) */}
            <div style={{ 
              flex: 1,
              background: selectedVehiculo ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))' : 'var(--surface-color)', 
              border: `1px ${selectedVehiculo ? 'solid' : 'dashed'} ${selectedVehiculo ? '#10b981' : 'var(--border-color)'}`,
              borderRadius: '0.5rem', 
              padding: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              {selectedVehiculo ? (
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', marginBottom: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '1rem', width: 'fit-content' }}>
                    <Check size={14} strokeWidth={3} /> <span style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VEHÍCULO IDENTIFICADO</span>
                  </div>
                  <h4 style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                    {selectedVehiculo.afiliados?.perfiles?.nombres || 'Afiliado ' + selectedVehiculo.afiliados?.numero_afiliado}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{ background: 'var(--bg-color)', padding: '0.35rem 0.75rem', borderRadius: '0.35rem', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Línea</span>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{selectedVehiculo.numero_linea}</span>
                    </div>
                    <div style={{ background: 'var(--bg-color)', padding: '0.35rem 0.75rem', borderRadius: '0.35rem', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Disco</span>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Nº {selectedVehiculo.numero_disco}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={24} opacity={0.3} />
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    {searchTerm.length >= 2 ? "No se encontró ningún vehículo." : "Escriba la placa o disco para buscar."}
                  </p>
                </div>
              )}
            </div>
            </div>

            {/* --- COLUMNA DERECHA: MULTA --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', transition: 'opacity 0.3s ease', opacity: selectedVehiculo ? 1 : 0.4, pointerEvents: selectedVehiculo ? 'auto' : 'none' }}>

            {/* Selector de Multa */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ background: '#ef4444', color: 'white', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.7rem' }}>2</span>
                Tipo de Infracción
              </label>
              <select 
                required 
                value={formData.id_tipo_multa} 
                onChange={handleMultaChange} 
                style={{ 
                  width: '100%',
                  fontSize: '0.95rem', 
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-color)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                <option value="">Seleccione sanción...</option>
                {tiposMulta.map(t => (
                  <option key={t.id_tipo_multa} value={t.id_tipo_multa}>{t.concepto}</option>
                ))}
              </select>
            </div>

            {/* Monto Automático */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Monto a Cobrar (Bs)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: '#ef4444', fontSize: '1rem' }}>Bs.</span>
                <input 
                  type="text" 
                  readOnly 
                  placeholder="0.00"
                  value={formData.monto_total} 
                  style={{ 
                    width: '100%',
                    padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                    fontSize: '1.25rem', 
                    fontWeight: '800', 
                    color: '#ef4444', 
                    backgroundColor: 'rgba(239, 68, 68, 0.05)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>
            </div>
            
            {/* Observaciones extra */}
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Observaciones (Opcional)</label>
              <textarea 
                placeholder="Ej. Retraso de 5 mins en cruce..." 
                value={formData.observaciones} 
                onChange={e => setFormData({...formData, observaciones: e.target.value})} 
                style={{ 
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  background: 'var(--surface-color)',
                  color: 'var(--text-main)',
                  resize: 'none',
                  height: '60px',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
              <button 
                type="submit" 
                disabled={!selectedVehiculo || !formData.id_tipo_multa}
                style={{ 
                  width: '100%',
                  background: (!selectedVehiculo || !formData.id_tipo_multa) ? 'var(--border-color)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: (!selectedVehiculo || !formData.id_tipo_multa) ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  padding: '0.75rem', 
                  fontSize: '1rem', 
                  fontWeight: 'bold',
                  borderRadius: '0.5rem',
                  cursor: (!selectedVehiculo || !formData.id_tipo_multa) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: (!selectedVehiculo || !formData.id_tipo_multa) ? 'none' : '0 4px 15px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                <AlertTriangle size={18} />
                PROCESAR INFRACCIÓN
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
