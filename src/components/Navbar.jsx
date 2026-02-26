// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Building2, ShieldCheck, User, Shield, Calculator, Menu, X, PieChart } from 'lucide-react';
import WeatherWidget from './WeatherWidget'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

const Navbar = ({ userName, userRole, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [permisos, setPermisos] = useState(null);

  useEffect(() => {
    if(auth.currentUser) {
      const unsub = onSnapshot(doc(db, 'usuarios', auth.currentUser.uid), docSnap => {
        if(docSnap.exists()) setPermisos(docSnap.data().permisos);
      });
      return () => unsub();
    }
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md relative z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* IZQUIERDA: MENÚ HAMBURGUESA Y CLIMA */}
            <div className="flex items-center w-[80%] md:w-[70%]">
              <button onClick={() => setIsMenuOpen(true)} className="p-2 mr-3 hover:bg-orange-700/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50">
                <Menu size={26} />
              </button>
              
              <div className="hidden sm:block flex-shrink-0 mr-3">
                <WeatherWidget />
              </div>
              
              <h1 className="text-lg font-extrabold truncate tracking-wide hidden lg:block drop-shadow-sm">
                Sistema Web Consumo Mipymes - BICSA V3
              </h1>
            </div>

            {/* DERECHA: INFO USUARIO Y SALIR */}
            <div className="flex items-center justify-end space-x-4 w-[40%] md:w-[20%]">
              <div className="flex flex-col items-end">
                <span className="text-xss font-bold text-white flex items-center">
                  <User className="w-3 h-6 mr-2 opacity-60" />              
                  {userName || 'Usuario'}
                </span>
                <span className="text-[10px] font-bold text-orange-100 uppercase tracking-wider flex items-center mt-0.5">
                  <Shield className="w-3 h-3 mr-1 opacity-80" />
                  Rol: {userRole || 'N/A'}
                </span>
              </div>

              <div className="h-6 w-px bg-orange-400/50 mx-2"></div>

              <button onClick={onLogout} className="flex items-center p-1.5 md:px-3 md:py-1.5 text-sm font-bold text-orange-600 bg-white hover:bg-orange-50 rounded-lg transition-colors shadow-sm active:scale-95" title="Cerrar Sesión">
                <LogOut className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* DRAWER LATERAL (MENÚ DESPLEGABLE) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
          
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col z-[101] transform transition-transform duration-300">
            
            <div className="p-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center">
                <Building2 className="mr-2" size={24}/>
                <span className="font-black text-xl tracking-wide">Menú Principal</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 bg-gray-50">
              
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Operaciones</div>

              <button onClick={() => handleNavigation('/dashboard')} className={`w-full flex items-center px-4 py-3.5 rounded-xl font-bold transition-all shadow-sm ${currentPath === '/dashboard' || currentPath === '/' ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-600' : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}>
                <LayoutDashboard className="mr-3" size={20}/> Dashboard Instituciones
              </button>

              <button onClick={() => handleNavigation('/instituciones')} className={`w-full flex items-center px-4 py-3.5 rounded-xl font-bold transition-all shadow-sm ${currentPath.includes('/instituciones') ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-600' : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}>
                <Building2 className="mr-3" size={20}/> Instituciones
              </button>

              <div className="my-4 border-t border-gray-200"></div>

              {/* SECCIÓN CONTABILIDAD */}
              {(userRole === 'admin' || permisos?.contabilidad?.acceso || permisos?.contabilidad?.dashboardFacturacion) && (
                <>
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 px-2 mt-4">Contabilidad</div>
                  
                  {(userRole === 'admin' || permisos?.contabilidad?.dashboardFacturacion) && (
                    <button onClick={() => handleNavigation('/dashboard-facturacion')} className={`w-full flex items-center px-4 py-3.5 rounded-xl font-bold transition-all shadow-sm ${currentPath.includes('/dashboard-facturacion') ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600' : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600'}`}>
                      <PieChart className="mr-3" size={20}/> Dashboard Facturación
                    </button>
                  )}

                  {(userRole === 'admin' || permisos?.contabilidad?.acceso) && (
                    <button onClick={() => handleNavigation('/facturacion')} className={`w-full flex items-center px-4 py-3.5 rounded-xl font-bold transition-all shadow-sm ${currentPath === '/facturacion' ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600' : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600'}`}>
                      <Calculator className="mr-3" size={20}/> Facturación
                    </button>
                  )}
                </>
              )}

              {/* SECCIÓN ADMIN */}
              {userRole === 'admin' && (
                <>
                  <div className="my-4 border-t border-gray-200"></div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 mt-4">Ajustes del Sistema</div>
                  <button onClick={() => handleNavigation('/admin')} className={`w-full flex items-center px-4 py-3.5 rounded-xl font-bold transition-all shadow-sm ${currentPath.includes('/admin') ? 'bg-slate-800 text-white border-l-4 border-slate-500' : 'bg-white text-gray-600 hover:bg-slate-100 hover:text-slate-800'}`}>
                    <ShieldCheck className="mr-3" size={20}/> Panel Admin / Usuarios
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;