import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Afiliados from './pages/Afiliados';
import Vehiculos from './pages/Vehiculos';
import Rutas from './pages/Rutas';
import Asambleas from './pages/Asambleas';
import Hacienda from './pages/Hacienda';
import Directiva from './pages/Directiva';
import Auditoria from './pages/Auditoria';
import Usuarios from './pages/Usuarios';
import MiPortal from './pages/MiPortal';
import Infracciones from './pages/Infracciones';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/mi-portal" replace />} />
            <Route path="mi-portal" element={<MiPortal />} />
            <Route path="afiliados" element={<Afiliados />} />
            <Route path="vehiculos" element={<Vehiculos />} />
            <Route path="rutas" element={<Rutas />} />
            <Route path="asambleas" element={<Asambleas />} />
            <Route path="hacienda" element={<Hacienda />} />
            <Route path="infracciones" element={<Infracciones />} />
            <Route path="perfiles" element={<Directiva />} /> {/* Historial de Directiva */}
            <Route path="usuarios" element={<Usuarios />} /> {/* Gestión de Accesos */}
            <Route path="auditoria" element={<Auditoria />} />
          </Route>
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
