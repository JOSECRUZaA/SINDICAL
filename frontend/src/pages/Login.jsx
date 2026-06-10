import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Bus, User } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Por favor intente de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper animate-fade-in">
      <div className="login-info-section">
        <img src="/logo.png" alt="Sindicato Logo" className="info-logo" />
        <h1>Sindicato 15 de Junio</h1>
        <p>
          Bienvenidos al Sistema de Gestión Integral. Trabajamos día a día por el bienestar,
          desarrollo y la defensa de los derechos de todos nuestros afiliados, brindando servicios transparentes y de calidad.
        </p>
        <div className="info-features">
          <div className="feature-item">
            <div className="feature-icon"><Bus size={20} /></div>
            <span>Gestión eficiente de flotas y rutas</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><User size={20} /></div>
            <span>Atención y control de afiliados en tiempo real</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Lock size={20} /></div>
            <span>Plataforma tecnológica segura y confiable</span>
          </div>
        </div>
      </div>

      <div className="login-form-section">
        <div className="login-card">
          
          <div className="login-header">
            <h2 className="login-title">Acceso al Sistema</h2>
            <p className="text-muted">Ingrese sus credenciales para continuar</p>
          </div>

        {error && (
          <div className="alert-error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <div className="input-wrapper">
              <div className="input-icon"><Mail size={18} /></div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="ejemplo@sindicato.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <div className="input-icon"><Lock size={18} /></div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary submit-btn"
            disabled={isLoading}
          >
            {isLoading ? <div className="spinner" style={{margin: '0 auto'}}></div> : 'Ingresar al Sistema'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
