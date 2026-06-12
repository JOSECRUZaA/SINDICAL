import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users, Bus, Map, FileText, DollarSign, Shield, Activity, Menu, X, UserCog, User, AlertTriangle, Calendar } from 'lucide-react';
import './Dashboard.css'; // Importamos el CSS dedicado

const Dashboard = () => {
  const { user, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'm0', label: 'Mi Portal', icon: User, path: '/mi-portal', roles: ['Afiliado', 'Administrador', 'Secretario', 'Tesorero', 'Controlador'] },
    { id: 'm1', label: 'Perfiles', icon: Shield, path: '/perfiles', roles: ['Administrador'] },
    { id: 'm2', label: 'Afiliados', icon: Users, path: '/afiliados', roles: ['Administrador', 'Secretario'] },
    { id: 'm3', label: 'Vehículos', icon: Bus, path: '/vehiculos', roles: ['Administrador', 'Secretario', 'Controlador'] },
    { id: 'm3b', label: 'Infracciones', icon: AlertTriangle, path: '/infracciones', roles: ['Administrador', 'Controlador'] },
    { id: 'm4', label: 'Rutas', icon: Map, path: '/rutas', roles: ['Administrador'] },
    { id: 'm5', label: 'Asambleas', icon: FileText, path: '/asambleas', roles: ['Administrador', 'Secretario'] },
    { id: 'm6', label: 'Hacienda', icon: DollarSign, path: '/hacienda', roles: ['Administrador', 'Tesorero'] },
    { id: 'm8', label: 'Auditoría', icon: Activity, path: '/auditoria', roles: ['Administrador'] },
    { id: 'm9', label: 'Usuarios Sistema', icon: UserCog, path: '/usuarios', roles: ['Administrador'] },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand" style={{ gap: '0.75rem', fontSize: '1.1rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <span style={{ lineHeight: '1.2' }}>Sindicato<br/><small style={{fontSize:'0.65rem', opacity:0.8}}>15 de Junio</small></span>
          </div>
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="sidebar-content">
          <nav className="nav-menu">
            {navItems.filter(item => !profile?.rol || item.roles.includes(profile?.rol)).map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button 
                  key={item.id} 
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="header-date">
              <Calendar size={18} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>¡Hola!</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{profile?.nombres || 'Usuario'}</span>
            </div>
            <div className="avatar" title={profile?.nombres} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <User size={20} />
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
