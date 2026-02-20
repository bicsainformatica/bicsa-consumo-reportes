// src/components/Login.jsx - DISEÑO RENOVADO MINIMALISTA NARANJA
import React, { useState } from 'react';
import { LogIn, Shield, AlertCircle, Loader2, Mail, Instagram, Facebook, Linkedin } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  
  // --- LÓGICA INTACTA ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado en la base de datos');
      }
      
      const userData = userDoc.data();
      
      if (!userData.activo) {
        throw new Error('Usuario desactivado. Contacta al administrador.');
      }
      
      const userRole = userData.rol || 'usuario';
      const userName = userData.nombre || user.email;
      
      await updateDoc(userDocRef, {
        ultimoAcceso: new Date().toISOString(),
        ultimoLoginIP: await obtenerIP()
      });
      
      onLogin(userRole, user.email, userName, user.uid);
      
    } catch (error) {
      console.error("❌ Error de autenticación:", error);
      let errorMessage = 'Error de autenticación';
      switch (error.code) {
        case 'auth/user-not-found': errorMessage = 'Usuario no registrado'; break;
        case 'auth/wrong-password': errorMessage = 'Contraseña incorrecta'; break;
        case 'auth/invalid-email': errorMessage = 'Email inválido'; break;
        case 'auth/too-many-requests': errorMessage = 'Demasiados intentos. Intenta más tarde.'; break;
        case 'auth/network-request-failed': errorMessage = 'Error de conexión.'; break;
        default: errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    setError('');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(`Se ha enviado un email a ${resetEmail}. Revisa tu bandeja.`);
    } catch (error) {
      let errorMessage = 'Error al procesar la solicitud';
      switch (error.code) {
        case 'auth/user-not-found': errorMessage = 'No existe cuenta con este email'; break;
        case 'auth/invalid-email': errorMessage = 'Email inválido'; break;
        default: errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const obtenerIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'Desconocida';
    }
  };
  // ----------------------

  // Componente de Redes Sociales (Reutilizable)
  const SocialLinks = () => (
    <div className="mt-8 pt-6 border-t border-orange-100 text-center">
      <p className="text-sm font-medium text-slate-500 mb-4">
        Seguinos en nuestras redes
      </p>
      <div className="flex justify-center space-x-6">
        <a href="https://www.instagram.com/bicsapy/?hl=es" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-orange-600 transition-colors hover:scale-110 transform">
          <Instagram className="w-6 h-6" />
          <span className="sr-only">Instagram</span>
        </a>
        <a href="https://www.facebook.com/bicsapy/?locale=es_LA" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-orange-600 transition-colors hover:scale-110 transform">
          <Facebook className="w-6 h-6" />
          <span className="sr-only">Facebook</span>
        </a>
        <a href="https://py.linkedin.com/company/bicsapy" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-orange-600 transition-colors hover:scale-110 transform">
          <Linkedin className="w-6 h-6" />
          <span className="sr-only">LinkedIn</span>
        </a>
      </div>
    </div>
  );

  // --- RENDERIZADO ---

  // 1. Formulario de Reset de Contraseña
  if (showResetForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-orange-100/50 backdrop-blur-sm">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Recuperar Acceso
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa tu email para recibir instrucciones
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-red-700 font-medium">{error}</span>
            </div>
          )}

          {resetMessage && (
            <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg flex items-center">
              <Mail className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-emerald-700 font-medium">{resetMessage}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handlePasswordReset}>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-bold text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-slate-50/50 focus:bg-white"
                placeholder="ejemplo@bicsa.com.py"
                disabled={resetLoading}
              />
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Enviar Instrucciones
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowResetForm(false);
                  setResetMessage('');
                  setError('');
                }}
                className="w-full py-3.5 px-4 text-sm font-bold text-slate-600 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-colors focus:outline-none"
              >
                Volver al Login
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Revisa tu carpeta de spam si no recibes el correo en unos minutos.
            </p>
          </div>
          
          {/* Redes Sociales en el Reset Form también */}
          <SocialLinks />
        </div>
      </div>
    );
  }

  // 2. Formulario Principal de Login
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-orange-100/50 backdrop-blur-sm">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Seguimiento Consumo MiPymes V2 - BICSA
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email-address" className="block text-sm font-bold text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email-address"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-slate-50/50 focus:bg-white"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-slate-50/50 focus:bg-white"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          <div className="bg-orange-50/80 p-4 rounded-xl border border-orange-100 flex items-center">
            <Shield className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
            <span className="text-sm font-medium text-orange-800 leading-tight">
              Tu rol y acceso se determinarán automáticamente.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Ingresar al Sistema
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowResetForm(true)}
              className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>

        {/* Nueva sección de Redes Sociales */}
        <SocialLinks />
        
      </div>
    </div>
  );
};

export default Login;