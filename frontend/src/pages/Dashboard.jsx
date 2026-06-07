import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users, Bus, Map, FileText, DollarSign, Shield, Activity, Menu, X, UserCog, User, AlertTriangle } from 'lucide-react';
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
    { id: 'm0', label: 'Mi Portal', icon: User, path: '/mi-portal', roles: ['Consulta', 'Afiliado', 'Chofer', 'Relevo', 'Administrador', 'Secretario', 'Tesorero', 'Controlador'] },
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
          <div className="brand">
            <Bus size={24} /> Sindicato
          </div>
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="user-info">
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Bienvenido,</div>
            <div className="user-name">{profile?.nombres || user?.email}</div>
            <div className="user-role">
              {profile?.rol || 'Rol no asignado'}
            </div>
          </div>

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
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div style={{ marginLeft: 'auto' }}>
            <div className="avatar" title={profile?.nombres}>
              {profile?.nombres?.charAt(0).toUpperCase() || 'U'}
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
