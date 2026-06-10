import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Bus, Award, DollarSign, Shield, CheckCircle, CreditCard, Calendar, Activity } from 'lucide-react';

const MiPortal = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [afiliadoData, setAfiliadoData] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [directiva, setDirectiva] = useState([]);
  const [deudas, setDeudas] = useState([]);

  useEffect(() => {
    if (profile?.id_perfil) {
      fetchMyData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const { data: afData, error: afError } = await supabase
        .from('afiliados')
        .select('*, categorias_licencia(categoria)')
        .eq('id_perfil', profile.id_perfil)
        .single();
        
      if (afError && afError.code !== 'PGRST116') throw afError;

      if (afData) {
        setAfiliadoData(afData);
        
        const { data: vData } = await supabase
          .from('vehiculos')
          .select('*')
          .eq('id_propietario', afData.id_afiliado);
        setVehiculos(vData || []);

        const { data: dData } = await supabase
          .from('directiva')
          .select('*, cargos_directiva(nombre_cargo)')
          .eq('id_afiliado', afData.id_afiliado)
          .order('gestion_inicio', { ascending: false });
        setDirectiva(dData || []);

        const { data: oData } = await supabase
          .from('obligaciones_financieras')
          .select('*, tipos_cuota(nombre), tipos_multa(concepto)')
          .eq('id_afiliado', afData.id_afiliado)
          .eq('estado', 'Pendiente');
        setDeudas(oData || []);
      }
    } catch (error) {
      console.error('Error cargando Mi Portal:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'Activo': return 'badge-success';
      case 'Suspendido': return 'badge-warning';
      case 'Expulsado': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  if (loading) {
    return (
      <div className="page-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!afiliadoData) {
    return (
      <div className="page-container animate-fade-in">
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
          <Shield size={64} style={{ color: 'var(--text-muted)', margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.75rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>Cuenta no vinculada</h2>
          <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            Tu cuenta web aún no ha sido vinculada a una ficha de afiliado oficial. 
            Por favor, comunícate con la Secretaría General para que vinculen tu usuario al sistema sindical.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* HEADER BANNER PERSONALIZADO */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary-color) 0%, #1e3a8a 100%)',
        borderRadius: '16px',
        padding: '2.5rem 3rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(22, 43, 76, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decoración de fondo */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
        <div style={{ position: 'absolute', bottom: '-80px', right: '50px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>

        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          background: 'linear-gradient(135deg, #c08d4a 0%, #d4af37 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', fontWeight: 'bold', color: 'white',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 1
        }}>
          {profile?.nombres?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div style={{ zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>
            Bienvenido a tu espacio personal
          </p>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {profile?.nombres}
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem' }}>
        
        {/* TARJETA 1: Ficha Sindical */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Ficha Sindical</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Identificación oficial</p>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(22, 43, 76, 0.05)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {afiliadoData.numero_afiliado}
            </div>
          </div>
          
          <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Activity size={18} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Tipo de Afiliado</p>
                <p style={{ fontSize: '1.05rem', fontWeight: '500', marginTop: '0.25rem' }}>{afiliadoData.tipo_afiliado}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <CreditCard size={18} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Cédula de Identidad</p>
                <p style={{ fontSize: '1.05rem', fontWeight: '500', marginTop: '0.25rem' }}>{afiliadoData.ci || 'No registrada'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <CheckCircle size={18} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Estado Orgánico</p>
                <div style={{ marginTop: '0.25rem' }}><span className={`badge ${getBadgeClass(afiliadoData.estado_organico)}`}>{afiliadoData.estado_organico}</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Calendar size={18} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Fecha de Ingreso</p>
                <p style={{ fontSize: '1.05rem', fontWeight: '500', marginTop: '0.25rem' }}>{new Date(afiliadoData.fecha_ingreso).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TARJETA 2: Vehículos */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Mi Parque Automotor</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Unidades de trabajo</p>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {vehiculos.length} {vehiculos.length === 1 ? 'Unidad' : 'Unidades'}
            </div>
          </div>
          
          <div style={{ padding: '2rem', flex: 1, backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
            {vehiculos.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6 }}>
                <Bus size={48} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '1.1rem' }}>No tienes vehículos registrados.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {vehiculos.map(v => (
                  <div key={v.id_vehiculo} style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          LÍNEA {v.numero_linea}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                          Disco {v.numero_disco}
                        </div>
                      </div>
                      <span className={`badge ${v.estado === 'Operativo' ? 'badge-success' : 'badge-warning'}`}>
                        {v.estado}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                      <div><span className="text-muted" style={{fontSize: '0.8rem', display: 'block'}}>PLACA</span> <span style={{fontWeight: '600', letterSpacing: '1px'}}>{v.placa}</span></div>
                      <div><span className="text-muted" style={{fontSize: '0.8rem', display: 'block'}}>MARCA</span> <span style={{fontWeight: '500'}}>{v.marca}</span></div>
                      <div><span className="text-muted" style={{fontSize: '0.8rem', display: 'block'}}>MODELO</span> <span style={{fontWeight: '500'}}>{v.modelo}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TARJETA 3: Estado de Cuenta */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: deudas.length === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: deudas.length === 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Deudas Pendientes</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Estado de cuenta financiero</p>
            </div>
          </div>
          
          <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {deudas.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.15) 100%)', borderRadius: '16px', padding: '2rem', border: '1px dashed rgba(16, 185, 129, 0.3)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
                  <Shield size={32} />
                </div>
                <h3 style={{ color: '#059669', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>¡Felicidades!</h3>
                <p style={{ color: '#047857', textAlign: 'center', fontSize: '1.1rem' }}>Te encuentras al día con todas tus obligaciones sindicales.</p>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                  {deudas.map(o => (
                    <div key={o.id_obligacion} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', borderLeft: '4px solid #ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--primary-color)' }}>{o.tipos_cuota?.nombre || o.tipos_multa?.concepto}</p>
                        <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} /> Vence: {new Date(o.fecha_limite).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#ef4444' }}>
                        {o.monto_total} <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Bs</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1.5rem', background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)' }}>Total a Pagar:</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ef4444' }}>
                    {deudas.reduce((sum, item) => sum + parseFloat(item.monto_total), 0).toFixed(2)} <small style={{fontSize:'1rem'}}>Bs</small>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* TARJETA 4: Historial Directivo (Solo si tiene) */}
        {directiva.length > 0 && (
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(192, 141, 74, 0.15)', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Historial Directivo</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Cargos ocupados en el sindicato</p>
              </div>
            </div>
            
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {directiva.map(d => {
                const isVigente = d.estado === 1 || d.activo;
                return (
                  <div key={d.id_historial || d.id_directiva} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: isVigente ? 'var(--secondary-color)' : '#cbd5e1', border: '3px solid #fff', boxShadow: '0 0 0 1px ' + (isVigente ? 'var(--secondary-color)' : '#cbd5e1'), zIndex: 1 }}></div>
                      <div style={{ width: '2px', flex: 1, background: '#e2e8f0', margin: '4px 0', minHeight: '30px' }}></div>
                    </div>
                    <div style={{ flex: 1, paddingBottom: '1rem', marginTop: '-4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary-color)' }}>{d.cargos_directiva?.nombre_cargo}</p>
                        {isVigente && <span className="badge badge-success" style={{ background: 'var(--secondary-color)', color: 'white' }}>Gestión Actual</span>}
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} /> 
                        {new Date(d.gestion_inicio).getFullYear()} - {d.gestion_fin ? new Date(d.gestion_fin).getFullYear() : 'Presente'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MiPortal;
