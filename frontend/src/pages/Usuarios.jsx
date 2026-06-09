import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserCog, Search, ShieldAlert, Check, Plus, Edit, X, User, Mail, Lock, CreditCard, Shield } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombres: '', paterno: '', materno: '', ci: '', correo: '', password: '', rol: 'Consulta'
  });
  
  // Lista de roles permitidos en el sistema
  const ROLES = ['Administrador', 'Secretario', 'Tesorero', 'Controlador', 'Consulta', 'Afiliado', 'Chofer', 'Relevo'];

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

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nombres: user.nombres || '',
      paterno: user.paterno || '',
      materno: user.materno || '',
      ci: user.ci || '',
      correo: user.correo || '',
      password: '', // No mostrar contraseña
      rol: user.rol || 'Consulta'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingUser) {
      // Editar
      const { error } = await supabase
        .from('perfiles')
        .update({
          nombres: formData.nombres,
          paterno: formData.paterno,
          materno: formData.materno,
          ci: formData.ci,
          rol: formData.rol
        })
        .eq('id_perfil', editingUser.id_perfil);
        
      if (error) alert('Error al actualizar: ' + error.message);
      else {
        setShowModal(false);
        fetchUsuarios();
      }
    } else {
      // Crear nuevo usuario en Auth y Perfiles sin cerrar la sesión actual
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const tempClient = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });

        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: formData.correo,
          password: formData.password,
          options: {
            data: {
              nombres: formData.nombres,
              ci: formData.ci
            }
          }
        });

        if (authError) throw authError;

        if (authData?.user) {
          // El trigger handle_new_user de Supabase ya insertó la fila base.
          // Solo necesitamos actualizarla con el resto de datos (paterno, materno, rol real).
          
          // Damos unos milisegundos para que el trigger termine
          await new Promise(resolve => setTimeout(resolve, 800));

          const { error: profileError } = await supabase
            .from('perfiles')
            .update({
              nombres: formData.nombres, // Por si acaso
              paterno: formData.paterno,
              materno: formData.materno,
              ci: formData.ci,
              rol: formData.rol
            })
            .eq('auth_user_id', authData.user.id);
          
          if (profileError) throw profileError;
        }
        
        setShowModal(false);
        fetchUsuarios();
        alert('Usuario creado exitosamente.');
      } catch (err) {
        alert('Error al crear usuario: ' + err.message);
      }
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
        <button className="btn btn-primary" onClick={() => {
          setEditingUser(null);
          setFormData({ nombres: '', paterno: '', materno: '', ci: '', correo: '', password: '', rol: 'Consulta' });
          setShowModal(true);
        }}>
          <Plus size={18} /> Nuevo Usuario
        </button>
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
                  <th>Acciones</th>
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
                          color: u.rol === 'Administrador' ? 'var(--secondary-color)' : '#fff',
                          border: '1px solid var(--border-color)',
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
                        style={{border: 'none', cursor: 'pointer', marginRight: '0.5rem'}}
                        title="Clic para Activar/Desactivar"
                      >
                        {u.estado === 1 ? 'Activo' : 'Bloqueado'}
                      </button>
                    </td>
                    <td>
                      <button className="btn-outline" style={{padding: '0.25rem 0.5rem', border: 'none'}} onClick={() => handleEdit(u)} title="Editar Información">
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

      {/* Modal Crear/Editar Usuario */}
      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
          <div className="modal-content" style={{
            maxWidth: '600px', 
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div className="modal-header" style={{ 
              background: 'var(--bg-color)', 
              borderBottom: '1px solid var(--border-color)',
              padding: '1.5rem',
              color: 'var(--primary-color)'
            }}>
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', margin: 0 }}>
                <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                  {editingUser ? <Edit size={20} color="white" /> : <UserCog size={20} color="white" />}
                </div>
                {editingUser ? 'Editar Perfil de Usuario' : 'Registrar Nuevo Usuario'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)} style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            
            {editingUser && (
              <div style={{ padding: '1rem 1.5rem', background: 'rgba(192, 141, 74, 0.1)', borderBottom: '1px solid rgba(192, 141, 74, 0.2)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={16} color="var(--secondary-color)" />
                <span><strong style={{color: 'var(--secondary-color)'}}>Nota de Seguridad:</strong> El correo y contraseña son credenciales privadas, solo pueden actualizarse desde la gestión de la propia cuenta.</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="modal-body form-grid custom-scrollbar" style={{ padding: '1.25rem 1.5rem', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="form-group full-width">
                  <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: '500' }}>Nombres Completos</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" required value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} style={{ paddingLeft: '2.5rem' }} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: '500' }}>Apellido Paterno</label>
                  <input type="text" value={formData.paterno} onChange={e => setFormData({...formData, paterno: e.target.value})} placeholder="(Opcional)" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: '500' }}>Apellido Materno</label>
                  <input type="text" value={formData.materno} onChange={e => setFormData({...formData, materno: e.target.value})} placeholder="(Opcional)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: '500' }}>Cédula de Identidad</label>
                  <div style={{ position: 'relative' }}>
                    <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" required value={formData.ci} onChange={e => setFormData({...formData, ci: e.target.value})} style={{ paddingLeft: '2.5rem' }} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: '500' }}>Rol en el Sistema</label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }} />
                    <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} style={{ paddingLeft: '2.5rem', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: '600' }}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="form-group full-width" style={{ marginTop: '0', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', fontWeight: 'bold' }}>Credenciales de Acceso</h4>
                  <div className="form-grid" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: '500' }}>Correo Electrónico</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="email" required disabled={!!editingUser} value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} style={{ paddingLeft: '2.5rem' }} />
                      </div>
                    </div>
                    
                    {!editingUser && (
                      <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: '500' }}>Contraseña Temporal</label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Mínimo 6 caracteres" minLength={6} style={{ paddingLeft: '2.5rem' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-color)', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ border: '1px solid var(--border-color)', background: '#fff' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 'bold' }}>
                  {editingUser ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
