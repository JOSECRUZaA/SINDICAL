import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Bus, Award, DollarSign, Shield } from 'lucide-react';

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
      // 1. Obtener datos del afiliado vinculado al perfil
      const { data: afData, error: afError } = await supabase
        .from('afiliados')
        .select('*, categorias_licencia(categoria)')
        .eq('id_perfil', profile.id_perfil)
        .single();
        
      if (afError && afError.code !== 'PGRST116') throw afError; // Ignorar si no encuentra nada

      if (afData) {
        setAfiliadoData(afData);
        
        // 2. Obtener Vehículos
        const { data: vData } = await supabase
          .from('vehiculos')
          .select('*')
          .eq('id_propietario', afData.id_afiliado);
        setVehiculos(vData || []);

        // 3. Obtener Historial Directivo
        const { data: dData } = await supabase
          .from('directiva')
          .select('*, cargos_directiva(nombre_cargo)')
          .eq('id_afiliado', afData.id_afiliado)
          .order('gestion_inicio', { ascending: false });
        setDirectiva(dData || []);

        // 4. Obtener Estado de Cuenta
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
        <div className="page-header">
          <div>
            <h2 className="page-title">Mi Portal</h2>
            <p className="text-muted">Resumen personal e información sindical.</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Shield size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3>Cuenta no vinculada</h3>
          <p className="text-muted" style={{ maxWidth: '400px', margin: '1rem auto' }}>
            Tu cuenta web aún no ha sido vinculada a una ficha de afiliado oficial. 
            Por favor, comunícate con la Secretaría General o Administración para que vinculen tu usuario.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Mi Portal</h2>
          <p className="text-muted">Bienvenido a tu espacio personal, {profile?.nombres}.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Panel Sindical */}
        <div className="glass-panel p-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div className="avatar" style={{ width: '50px', height: '50px', fontSize: '1.5rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
              <User size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Ficha Sindical</h3>
              <p className="text-muted text-sm">{afiliadoData.numero_afiliado}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider">Tipo de Afiliado</p>
              <p className="font-medium mt-1">{afiliadoData.tipo_afiliado}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider">Cédula de Identidad</p>
              <p className="font-medium mt-1">{afiliadoData.ci || 'No registrada'}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider">Categoría Licencia</p>
              <p className="font-medium mt-1">{afiliadoData.categorias_licencia?.categoria || '-'}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider">Estado Orgánico</p>
              <p className="mt-1"><span className={`badge ${getBadgeClass(afiliadoData.estado_organico)}`}>{afiliadoData.estado_organico}</span></p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p className="text-muted text-xs uppercase tracking-wider">Fecha de Ingreso</p>
              <p className="font-medium mt-1">{new Date(afiliadoData.fecha_ingreso).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Panel Vehículos */}
        <div className="glass-panel p-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div className="avatar" style={{ width: '50px', height: '50px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              <Bus size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Mi Parque Automotor</h3>
          </div>
          
          {vehiculos.length === 0 ? (
            <p className="text-muted text-center py-4">No tienes vehículos registrados a tu nombre.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {vehiculos.map(v => (
                <div key={v.id_vehiculo} style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      Disco Nº {v.numero_disco}
                    </div>
                    <span className={`badge ${v.estado === 'Operativo' ? 'badge-success' : 'badge-warning'}`}>
                      {v.estado}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div><span className="text-muted">Placa:</span> <span style={{letterSpacing: '1px'}}>{v.placa}</span></div>
                    <div><span className="text-muted">Línea:</span> {v.numero_linea}</div>
                    <div><span className="text-muted">Marca:</span> {v.marca}</div>
                    <div><span className="text-muted">Modelo:</span> {v.modelo}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Estado de Cuenta */}
        <div className="glass-panel p-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div className="avatar" style={{ width: '50px', height: '50px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Deudas Pendientes</h3>
              <p className="text-muted text-sm">Estado de cuenta actual</p>
            </div>
          </div>
          
          {deudas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ display: 'inline-block', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: '#10b981', marginBottom: '1rem' }}>
                <Shield size={32} />
              </div>
              <p style={{ color: '#10b981', fontWeight: '600' }}>¡Felicidades!</p>
              <p className="text-muted text-sm mt-1">No tienes deudas pendientes.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {deudas.map(o => (
                  <div key={o.id_obligacion} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #ef4444' }}>
                    <div>
                      <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>{o.tipos_cuota?.nombre || o.tipos_multa?.concepto}</p>
                      <p className="text-muted" style={{ fontSize: '0.75rem' }}>Vence: {new Date(o.fecha_limite).toLocaleDateString()}</p>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#ef4444' }}>
                      {o.monto_total} Bs
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted font-medium">Total Deuda:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {deudas.reduce((sum, item) => sum + parseFloat(item.monto_total), 0).toFixed(2)} Bs
                </span>
              </div>
            </>
          )}
        </div>

        {/* Panel Historial Directivo */}
        {directiva.length > 0 && (
          <div className="glass-panel p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div className="avatar" style={{ width: '50px', height: '50px', backgroundColor: 'rgba(192, 141, 74, 0.2)', color: 'var(--secondary-color)' }}>
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Cargos en Directiva</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {directiva.map(d => (
                <div key={d.id_historial || d.id_directiva} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.estado === 1 || d.activo ? '#10b981' : 'var(--text-muted)' }}></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '500' }}>{d.cargos_directiva?.nombre_cargo}</p>
                    <p className="text-muted text-xs">Gestión: {new Date(d.gestion_inicio).getFullYear()} - {d.gestion_fin ? new Date(d.gestion_fin).getFullYear() : 'Actual'}</p>
                  </div>
                  {d.estado === 1 || d.activo ? (
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Vigente</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MiPortal;
