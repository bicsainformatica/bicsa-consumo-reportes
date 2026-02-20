// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// Importa tus componentes
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Instituciones from './components/Instituciones';
import Admin from './components/Admin';
import Login from './components/Login';

function App() {
  // Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' o 'usuario'
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState(''); // ✨ NUEVO: Estado para el nombre
  const [loading, setLoading] = useState(true); 
  
  // Estado para manejar función de exportación Excel
  const [exportExcelFunction, setExportExcelFunction] = useState(null);

  // Verificar si hay una sesión guardada al cargar la aplicación
  useEffect(() => {
    const savedAuth = localStorage.getItem('mipyme_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setIsAuthenticated(true);
        setUserRole(authData.role);
        setUserEmail(authData.email);
        setUserName(authData.name || ''); // ✨ NUEVO: Recuperar el nombre guardado
      } catch (error) {
        console.error('Error al cargar sesión guardada:', error);
        localStorage.removeItem('mipyme_auth');
      }
    }
    setLoading(false);
  }, []);

  // Función para manejar el login (Ahora recibe 4 parámetros desde Login.jsx)
  const handleLogin = (role, email, name, uid) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserEmail(email);
    setUserName(name); // ✨ Guardar el nombre en el estado
    
    // Guardar en localStorage para persistir entre recargas
    const authData = {
      role: role,
      email: email,
      name: name, // ✨ Guardar el nombre en localStorage
      uid: uid,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('mipyme_auth', JSON.stringify(authData));
  };

  // Función para manejar el logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail('');
    setUserName(''); // ✨ Limpiar el nombre al salir
    setExportExcelFunction(null);
    
    // Limpiar localStorage
    localStorage.removeItem('mipyme_auth');
  };

  // Función para manejar la exportación Excel desde el navbar
  const handleExportFromNavbar = () => {
    if (exportExcelFunction) {
      exportExcelFunction();
    } else {
      alert('La función de exportación no está disponible en este momento. Inténtalo de nuevo.');
    }
  };

  // Función para registrar la función de exportación desde Dashboard
  const handleRegisterExportFunction = (exportFunction) => {
    setExportExcelFunction(() => exportFunction);
  };

  // Mostrar loading mientras verifica la sesión
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* La barra de navegación solo aparece si está autenticado */}
      {isAuthenticated && (
        <Navbar 
          userName={userName || userEmail} // ✨ ACTUALIZADO: Le pasamos el nombre real
          userRole={userRole} 
          userEmail={userEmail} 
          onLogout={handleLogout}
          onExportExcel={userRole === 'usuario' ? handleExportFromNavbar : null}
        />
      )}
      
      {/* El contenido principal cambiará según la URL */}
      <main>
        <Routes>
          {/* Ruta del login - siempre accesible */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                // Si ya está logueado, redireccionar según el rol
                userRole === 'admin' ? <Admin /> : 
                <Dashboard onExportExcel={handleRegisterExportFunction} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          
          {/* Rutas protegidas */}
          {isAuthenticated && (
            <>
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard 
                    onExportExcel={userRole === 'usuario' ? handleRegisterExportFunction : null} 
                  />
                } 
              />
              
              {/* Instituciones disponible para todos los usuarios autenticados */}
              <Route path="/instituciones" element={<Instituciones />} />
              
              {/* Admin solo para admin */}
              {userRole === 'admin' && (
                <Route path="/admin" element={<Admin />} />
              )}
            </>
          )}
          
          {/* Ruta por defecto - redirige al login si no está autenticado */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? (
                userRole === 'admin' ? 
                <Admin /> : 
                <Dashboard onExportExcel={handleRegisterExportFunction} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;