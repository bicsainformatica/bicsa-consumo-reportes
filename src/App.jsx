// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/sileo';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DashboardFacturacion from './components/DashboardFacturacion'; // ✨ NUEVO
import Instituciones from './components/Instituciones';
import CargasXML from './components/CargasXML'; // ✨ NUEVO
import Admin from './components/Admin';
import Login from './components/Login';
import Facturacion from './components/Facturacion';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); 
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState(''); 
  const [loading, setLoading] = useState(true); 
  const [exportExcelFunction, setExportExcelFunction] = useState(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('mipyme_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setIsAuthenticated(true);
        setUserRole(authData.role);
        setUserEmail(authData.email);
        setUserName(authData.name || ''); 
      } catch (error) {
        localStorage.removeItem('mipyme_auth');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (role, email, name, uid) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserEmail(email);
    setUserName(name); 
    const authData = { role, email, name, uid, timestamp: new Date().getTime() };
    localStorage.setItem('mipyme_auth', JSON.stringify(authData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail('');
    setUserName(''); 
    setExportExcelFunction(null);
    localStorage.removeItem('mipyme_auth');
  };

  const handleRegisterExportFunction = (exportFunction) => {
    setExportExcelFunction(() => exportFunction);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
    <Toaster 
      position="top-center" 
      offset="24px"
      theme="light"
      options={{ 
        fill: '#1e3a5f'
      }} 
    />
      {isAuthenticated && (
        <Navbar userName={userName || userEmail} userRole={userRole} onLogout={handleLogout} />
      )}
      
      <main>
        <Routes>
          <Route path="/" element={isAuthenticated ? (userRole === 'admin' ? <Admin /> : userRole === 'contabilidad' ? <Facturacion /> : <Dashboard onExportExcel={handleRegisterExportFunction} />) : (<Login onLogin={handleLogin} />)} />
          
          {isAuthenticated && (
            <>
              <Route path="/dashboard" element={<Dashboard onExportExcel={userRole === 'usuario' ? handleRegisterExportFunction : null} />} />
              <Route path="/dashboard-facturacion" element={<DashboardFacturacion />} />
              <Route path="/instituciones" element={<Instituciones />} />
              <Route path="/cargas-xml" element={<CargasXML userRole={userRole} />} />
              <Route path="/facturacion" element={<Facturacion />} />
              {userRole === 'admin' && <Route path="/admin" element={<Admin />} />}
            </>
          )}
          
          <Route path="*" element={isAuthenticated ? (userRole === 'admin' ? <Admin /> : userRole === 'contabilidad' ? <Facturacion /> : <Dashboard onExportExcel={handleRegisterExportFunction} />) : (<Login onLogin={handleLogin} />)} />
        </Routes>
      </main>
    </div>
  );
}

export default App;