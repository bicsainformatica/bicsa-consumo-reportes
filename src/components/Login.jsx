// src/components/Login.jsx - DISEÑO PREMIUM LIGHT CON TECNOLOGÍA FLUIDA
import React, { useState } from 'react';
import { LogIn, Shield, AlertCircle, Loader2, Mail, Instagram, Facebook, Linkedin } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion } from 'framer-motion';

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

  // Estilos CSS locales de tecnología y efectos
  const styleTag = (
    <style>{`
      @keyframes tech-border-flow {
        0% { background-position: 0% 0%; }
        100% { background-position: 200% 0%; }
      }
      @keyframes tech-float-slow {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(35px, -35px) scale(1.1); }
      }
      @keyframes tech-float-medium {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(-25px, 45px) scale(0.9); }
      }
      @keyframes tech-float-fast {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(20px, 20px) scale(1.05); }
      }
      .tech-card {
        position: relative;
        background: rgba(255, 255, 255, 0.78);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.06), 0 0 40px 0 rgba(255, 81, 5, 0.04);
        overflow: hidden;
      }
      .tech-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 4px;
        background: linear-gradient(90deg, #ff5105, #e0a82e, #a855f7, #ff5105);
        background-size: 200% auto;
        animation: tech-border-flow 4s linear infinite;
        z-index: 10;
      }
      .tech-glow-spot-1 {
        animation: tech-float-slow 16s ease-in-out infinite;
      }
      .tech-glow-spot-2 {
        animation: tech-float-medium 20s ease-in-out infinite;
      }
      .tech-glow-spot-3 {
        animation: tech-float-fast 12s ease-in-out infinite;
      }
      .tech-input {
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .tech-input:focus {
        border-color: #ff5105;
        box-shadow: 0 0 0 4px rgba(255, 81, 5, 0.08);
        background-color: #fff;
      }
    `}</style>
  );

  // Variantes para animación de entrada escalonada (Stagger)
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 15 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.06
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  // Componente de Redes Sociales (Reutilizable)
  const SocialLinks = () => (
    <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-slate-100 text-center">
      <p className="text-sm font-semibold text-slate-500 mb-4">
        Seguinos en nuestras redes
      </p>
      <div className="flex justify-center space-x-6">
        <a href="https://www.instagram.com/bicsapy/?hl=es" target="_blank" rel="noreferrer" className="text-slate-450 hover:text-[#ff5105] transition-all hover:scale-110 transform duration-200">
          <Instagram className="w-5 h-5" />
          <span className="sr-only">Instagram</span>
        </a>
        <a href="https://www.facebook.com/bicsapy/?locale=es_LA" target="_blank" rel="noreferrer" className="text-slate-450 hover:text-[#ff5105] transition-all hover:scale-110 transform duration-200">
          <Facebook className="w-5 h-5" />
          <span className="sr-only">Facebook</span>
        </a>
        <a href="https://py.linkedin.com/company/bicsapy" target="_blank" rel="noreferrer" className="text-slate-450 hover:text-[#ff5105] transition-all hover:scale-110 transform duration-200">
          <Linkedin className="w-5 h-5" />
          <span className="sr-only">LinkedIn</span>
        </a>
      </div>
    </motion.div>
  );

  // --- RENDERIZADO ---

  // 1. Formulario de Reset de Contraseña
  if (showResetForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden grid-overlay p-4">
        {styleTag}
        
        {/* Glow spots dinámicos con movimientos fluidos */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[110px] bg-brand-500/10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 tech-glow-spot-1"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[110px] bg-purple-500/10 pointer-events-none transform translate-x-1/2 translate-y-1/2 tech-glow-spot-2"></div>
        <div className="absolute top-1/2 left-2/3 w-80 h-80 rounded-full blur-[100px] bg-blue-500/10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 tech-glow-spot-3"></div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md p-8 tech-card rounded-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <motion.h2 variants={itemVariants} className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Recuperar Acceso
            </motion.h2>
            <motion.p variants={itemVariants} className="mt-2 text-sm text-slate-500 font-medium">
              Ingresa tu email para recibir instrucciones
            </motion.p>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center border border-red-200"
            >
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-red-800 font-medium">{error}</span>
            </motion.div>
          )}

          {resetMessage && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-center border border-emerald-250"
            >
              <Mail className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
              <span className="text-sm text-emerald-800 font-medium">{resetMessage}</span>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handlePasswordReset}>
            <motion.div variants={itemVariants}>
              <label htmlFor="reset-email" className="block text-sm font-semibold text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none tech-input text-slate-850 placeholder-slate-400 bg-white"
                placeholder="ejemplo@bicsa.com.py"
                disabled={resetLoading}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#ff5105] to-[#ff7733] hover:shadow-lg hover:shadow-[#ff5105]/20 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff5105] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
                className="w-full py-3.5 px-4 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-350 rounded-xl transition-all duration-200 focus:outline-none"
              >
                Volver al Login
              </button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Revisa tu carpeta de spam si no recibes el correo en unos minutos.
            </p>
          </motion.div>
          
          <SocialLinks />
        </motion.div>
      </div>
    );
  }

  // 2. Formulario Principal de Login
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden grid-overlay p-4">
      {styleTag}

      {/* Glow spots dinámicos con movimientos fluidos */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[110px] bg-brand-500/10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 tech-glow-spot-1"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[110px] bg-purple-500/10 pointer-events-none transform translate-x-1/2 translate-y-1/2 tech-glow-spot-2"></div>
      <div className="absolute top-1/2 left-2/3 w-80 h-80 rounded-full blur-[100px] bg-blue-500/10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 tech-glow-spot-3"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md p-8 tech-card rounded-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <motion.h2 variants={itemVariants} className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Iniciar Sesión
          </motion.h2>
          <motion.p variants={itemVariants} className="mt-2 text-sm font-semibold text-slate-500">
            Registro Consumo MiPymes V3.1 - BICSA
          </motion.p>
        </div>

        {error && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center border border-red-200"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <span className="text-sm text-red-800 font-medium">{error}</span>
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-5">
            <motion.div variants={itemVariants}>
              <label htmlFor="email-address" className="block text-sm font-semibold text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email-address"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none tech-input text-slate-850 placeholder-slate-400 bg-white"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none tech-input text-slate-850 placeholder-slate-400 bg-white"
                placeholder="••••••••"
                disabled={loading}
              />
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="bg-brand-50 p-4 rounded-xl border border-brand-100/80 flex items-center">
            <Shield className="w-5 h-5 text-brand-600 mr-3 flex-shrink-0" />
            <span className="text-sm font-semibold text-brand-850 leading-tight">
              Tu rol y acceso se determinarán automáticamente.
            </span>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#ff5105] to-[#ff7733] hover:shadow-lg hover:shadow-[#ff5105]/20 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff5105] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <button
              type="button"
              onClick={() => setShowResetForm(true)}
              className="text-sm font-bold text-[#ff5105] hover:text-[#ff7733] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </motion.div>
        </form>

        <SocialLinks />
      </motion.div>
    </div>
  );
};

export default Login;