import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserCog, Search, ShieldAlert, Check } from 'lucide-react';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lista de roles permitidos en el sistema
  const ROLES = ['Administrador', 'Secretario', 'Tesorero', 'Controlador', 'Consulta', 'Afiliado'];

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('fecha_registro', { ascending: false });
      
    if (!error) setUsuarios(data || []);
    setLoading(false);
  };

  const handleRoleChange = async (id_perfil, nuevoRol) => {
    // Optimistic UI update
    setUsuarios(prev => prev.map(u => u.id_perfil === id_perfil ? { ...u, rol: nuevoRol } : u));
    
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id_perfil', id_perfil);
      
    if (error) {
      alert('Error al cambiar rol: ' + error.message);
      fetchUsuarios(); // Revert on error
    }
  };

  const handleEstadoChange = async (id_perfil, estadoActual) => {
    const nuevoEstado = estadoActual === 1 ? 0 : 1;
    
    setUsuarios(prev => prev.map(u => u.id_perfil === id_perfil ? { ...u, estado: nuevoEstado } : u));
    
    const { error } = await supabase
      .from('perfiles')
      .update({ estado: nuevoEstado })
      .eq('id_perfil', id_perfil);
      
    if (error) {
      alert('Error al cambiar estado: ' + error.message);
      fetchUsuarios();
    }
  };

  const filtered = usuarios.filter(u => 
    u.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.ci?.includes(searchTerm) ||
    u.correo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gestión de Usuarios del Sistema</h2>
          <p className="text-muted">Administración de accesos y roles de la plataforma.</p>
        </div>
      </div>

      <div className="glass-table-container">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, CI o correo..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No se encontraron usuarios.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombres</th>
                  <th>CI</th>
                  <th>Correo</th>
                  <th>Rol en el Sistema</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id_perfil}>
                    <td className="font-medium text-white">
                      <UserCog size={16} style={{display:'inline', marginRight:'0.5rem', color:'var(--primary-color)'}}/> 
                      {u.nombres} {u.paterno} {u.materno}
                    </td>
                    <td>{u.ci}</td>
                    <td>{u.correo}</td>
                    <td>
                      <select 
                        value={u.rol} 
                        onChange={(e) => handleRoleChange(u.id_perfil, e.target.value)}
                        style={{
                          background: 'rgba(0,0,0,0.3)', 
                          color: u.rol === 'Administrador' ? '#f59e0b' : '#fff',
                          border: '1px solid rgba(255,255,255,0.1)',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          fontWeight: u.rol === 'Administrador' ? 'bold' : 'normal'
                        }}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleEstadoChange(u.id_perfil, u.estado)}
                        className={`badge ${u.estado === 1 ? 'badge-success' : 'badge-danger'}`}
                        style={{border: 'none', cursor: 'pointer'}}
                        title="Clic para Activar/Desactivar"
                      >
                        {u.estado === 1 ? 'Activo' : 'Bloqueado'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Usuarios;
