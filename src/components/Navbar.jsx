import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Building2, ShieldCheck, User, Shield, FileSpreadsheet } from 'lucide-react';
import WeatherWidget from './WeatherWidget'; 

// ✨ AQUÍ AGREGAMOS onExportExcel A LAS PROPS RECIBIDAS
const Navbar = ({ userName, userRole, onLogout, onExportExcel }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md relative z-40">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* SECCIÓN IZQUIERDA: Widget y Título */}
          <div className="flex items-center w-[45%] overflow-hidden">
            <div className="flex-shrink-0 mr-3">
              <WeatherWidget />
            </div>
            
            <h1 className="text-lg font-extrabold truncate tracking-wide hidden sm:block drop-shadow-sm">
              Seguimiento Consumo MiPymes V2 - BICSA
            </h1>
          </div>

          {/* SECCIÓN CENTRAL: Botones de Navegación con React Router */}
          <div className="hidden md:flex space-x-2 w-[35%] justify-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                currentPath === '/dashboard' || currentPath === '/' ? 'bg-white text-orange-600 scale-105' : 'bg-orange-700/40 hover:bg-orange-600 text-white hover:scale-105'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              Dashboard
            </button>
            
            <button 
              onClick={() => navigate('/instituciones')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                currentPath.includes('/instituciones') ? 'bg-white text-orange-600 scale-105' : 'bg-orange-700/40 hover:bg-orange-600 text-white hover:scale-105'
              }`}
            >
              <Building2 className="w-4 h-4 mr-1.5" />
              Instituciones
            </button>

            {/* Renderizado condicional según el Rol */}
            {userRole === 'admin' ? (
              <button 
                onClick={() => navigate('/admin')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                  currentPath.includes('/admin') || currentPath.includes('/usuarios') ? 'bg-white text-orange-600 scale-105' : 'bg-orange-700/40 hover:bg-orange-600 text-white hover:scale-105'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Panel Admin
              </button>
            ) : (
              // ✨ AQUÍ CAMBIAMOS EL COMPORTAMIENTO: AHORA LLAMA A LA FUNCIÓN DE DESCARGA
              <button 
                onClick={onExportExcel} 
                className="flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm bg-emerald-600/80 hover:bg-emerald-500 text-white hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                Descargar Reporte
              </button>
            )}
          </div>

          {/* SECCIÓN DERECHA: Info del Usuario y Botón de Salida */}
          <div className="flex items-center justify-end space-x-4 w-[20%]">
            
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-bold text-white flex items-center">
                <User className="w-3 h-3 mr-1 opacity-80" />
                {userName || 'Usuario'}
              </span>
              <span className="text-[10px] font-bold text-orange-100 uppercase tracking-wider flex items-center mt-0.5">
                <Shield className="w-3 h-3 mr-1 opacity-80" />
                Rol: {userRole || 'N/A'}
              </span>
            </div>

            <div className="hidden lg:block h-6 w-px bg-orange-400/50 mx-2"></div>

            <button
              onClick={onLogout}
              className="flex items-center p-1.5 md:px-3 md:py-1.5 text-sm font-bold text-orange-600 bg-white hover:bg-orange-50 rounded-lg transition-colors shadow-sm active:scale-95"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 md:mr-1.5" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;