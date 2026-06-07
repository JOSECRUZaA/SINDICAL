import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Bus, User, CreditCard } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombres, setNombres] = useState('');
  const [ci, setCi] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, nombres, ci);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Por favor intente de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card">
        
        <div className="login-header">
          <div className="login-icon-wrapper">
            <Bus size={32} />
          </div>
          <h1 className="login-title">Sindicato</h1>
          <p className="text-muted">Sistema de Gestión Integral</p>
        </div>

        <div className="login-tabs">
          <button 
            type="button"
            className={`login-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Iniciar Sesión
          </button>
          <button 
            type="button"
            className={`login-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Crear Cuenta
          </button>
        </div>

        {error && (
          <div className="alert-error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {!isLogin && (
            <div className="animate-fade-in">
              <div className="form-group">
                <label className="form-label" htmlFor="nombres">Nombre Completo</label>
                <div className="input-wrapper">
                  <div className="input-icon"><User size={18} /></div>
                  <input
                    id="nombres"
                    type="text"
                    required={!isLogin}
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    className="form-input"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ci">Cédula de Identidad</label>
                <div className="input-wrapper">
                  <div className="input-icon"><CreditCard size={18} /></div>
                  <input
                    id="ci"
                    type="text"
                    required={!isLogin}
                    value={ci}
                    onChange={(e) => setCi(e.target.value)}
                    className="form-input"
                    placeholder="Ej. 1234567"
                  />
                </div>
              </div>
            </div>
          )}

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
            {isLoading ? <div className="spinner" style={{margin: '0 auto'}}></div> : (isLogin ? 'Ingresar al Sistema' : 'Registrar Usuario')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
