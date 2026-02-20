// src/components/GestionUsuarios.jsx - VERSIÓN SEGURA
import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  X, 
  Trash2, 
  Shield, 
  User,
  Mail,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useUsuarios } from '../hooks/useFirebase'; // ← Usar el hook seguro

const ModalAgregarUsuario = ({ onClose, onSave }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('usuario');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (nombre.trim() && email.trim() && password.trim()) {
      setSaving(true);
      const resultado = await onSave({
        nombre: nombre.trim(),
        email: email.trim(),
        password: password.trim(),
        rol
      });
      
      if (resultado.success) {
        setNombre('');
        setEmail('');
        setPassword('');
        setRol('usuario');
        onClose();
      } else {
        alert(`Error al crear usuario: ${resultado.error}`);
      }
      setSaving(false);
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Nuevo Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={saving}>
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={16} className="inline mr-1" />
              Nombre Completo
            </label>
            <input 
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Juan Pérez"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail size={16} className="inline mr-1" />
              Correo Electrónico
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: juan@empresa.com"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Key size={16} className="inline mr-1" />
              Contraseña
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mínimo 6 caracteres"
              disabled={saving}
              minLength="6"
            />
            <p className="text-xs text-gray-500 mt-1">
              Firebase requiere mínimo 6 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Usuario
            </label>
            <select 
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            >
              <option value="usuario">👤 Usuario - Gestión de instituciones</option>
              <option value="admin">🛡️ Administrador - Acceso completo</option>
            </select>
          </div>

          {/* Información del rol seleccionado */}
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-center">
              {rol === 'admin' ? (
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
              ) : (
                <User className="w-5 h-5 text-blue-600 mr-2" />
              )}
              <span className="text-sm text-blue-800">
                {rol === 'admin' 
                  ? 'Acceso completo: Dashboard, Instituciones, Admin y Gestión de Usuarios'
                  : 'Acceso limitado: Dashboard e Instituciones (sin gestión de usuarios)'
                }
              </span>
            </div>
          </div>
          
          {/* Advertencia de seguridad */}
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Este usuario será creado en Firebase Authentication y podrá acceder al sistema.
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button 
            onClick={onClose} 
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            disabled={saving}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            <span>{saving ? 'Creando en Firebase...' : 'Crear Usuario'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const GestionUsuarios = () => {
  const [showModal, setShowModal] = useState(false);
  
  // 🔐 USAR EL HOOK SEGURO CON FIREBASE
  const { 
    usuarios, 
    loading, 
    error, 
    agregarUsuario, 
    eliminarUsuario, 
    toggleUsuarioActivo 
  } = useUsuarios();

  // Función para agregar nuevo usuario - ahora conecta con Firebase
  const handleSave = async (nuevoUsuario) => {
    console.log("🔐 Creando nuevo usuario en Firebase:", nuevoUsuario.email);
    const resultado = await agregarUsuario(nuevoUsuario);
    
    if (resultado.success) {
      alert(`Usuario "${nuevoUsuario.nombre}" creado exitosamente en Firebase!`);
    }
    
    return resultado;
  };

  // Función para eliminar usuario - ahora conecta con Firebase
  const handleDelete = async (uid, nombre) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${nombre}"?\n\nEsta acción eliminará el usuario de la base de datos.`)) {
      const resultado = await eliminarUsuario(uid, nombre);
      
      if (resultado.success) {
        alert(`Usuario "${nombre}" eliminado exitosamente!`);
      } else {
        alert(`Error al eliminar: ${resultado.error}`);
      }
    }
  };

  // Función para cambiar estado activo/inactivo - ahora conecta con Firebase
  const handleToggleActivo = async (uid) => {
    const resultado = await toggleUsuarioActivo(uid);
    
    if (!resultado.success) {
      alert(`Error: ${resultado.error}`);
    }
  };

  // Mostrar loading
  if (loading && usuarios.length === 0) {
    return (
      <div className="p-6 sm:p-10 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando usuarios desde Firebase...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="p-6 sm:p-10 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Error al cargar usuarios</p>
          <p className="text-red-500 text-sm mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users size={32} className="mr-3 text-blue-700"/>
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los usuarios del sistema MiPyme Monitor
          </p>
          <p className="text-sm text-blue-600 mt-1">
            🔐 Conectado con Firebase Authentication
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold flex items-center hover:bg-blue-700 transition-all shadow-sm"
          disabled={loading}
        >
          <UserPlus size={20} className="mr-2"/>
          Agregar Usuario
        </button>
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Users className="text-blue-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-800">{usuarios.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Shield className="text-green-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Administradores</p>
              <p className="text-2xl font-bold text-gray-800">
                {usuarios.filter(u => u.rol === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="text-purple-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-800">
                {usuarios.filter(u => u.activo).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Lista de Usuarios</h3>
          <p className="text-sm text-gray-500 mt-1">
            Usuarios registrados en Firebase Authentication
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        usuario.rol === 'admin' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {usuario.rol === 'admin' ? (
                          <Shield className="text-blue-600" size={20} />
                        ) : (
                          <User className="text-gray-600" size={20} />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                        <div className="text-sm text-gray-500">{usuario.email}</div>
                        <div className="text-xs text-gray-400">ID: {usuario.uid?.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      usuario.rol === 'admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {usuario.rol === 'admin' ? '🛡️ Admin' : '👤 Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActivo(usuario.uid)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        usuario.activo 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                      disabled={loading}
                    >
                      {usuario.activo ? (
                        <>
                          <CheckCircle size={12} className="mr-1" />
                          Activo
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="mr-1" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.ultimoAcceso}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleDelete(usuario.uid, usuario.nombre)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Eliminar usuario"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {usuarios.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto mb-2" size={32} />
            <p>No hay usuarios registrados</p>
            <p className="text-sm">Crea el primer usuario para comenzar</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ModalAgregarUsuario 
          onClose={() => setShowModal(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
};

export default GestionUsuarios;