// src/components/Comentarios.jsx
import React, { useState } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Edit3, 
  Trash2, 
  User,
  Clock,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useComentarios } from '../hooks/useFirebase';
import { auth } from '../firebase';

const ModalComentarios = ({ institucion, onClose }) => {
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [comentarioEditando, setComentarioEditando] = useState(null);
  const [textoEditando, setTextoEditando] = useState('');
  const [saving, setSaving] = useState(false);

  const { 
    comentarios, 
    loading, 
    error,
    agregarComentario,
    editarComentario,
    eliminarComentario 
  } = useComentarios(institucion.id);

  const currentUser = auth.currentUser;

  const handleAgregarComentario = async () => {
    if (!nuevoComentario.trim()) {
      alert('Por favor, escribe un comentario antes de enviarlo.');
      return;
    }

    setSaving(true);
    try {
      const resultado = await agregarComentario({
        texto: nuevoComentario.trim(),
        institucionId: institucion.id
      });

      if (resultado.success) {
        setNuevoComentario('');
        // No necesitamos alert porque el comentario aparece inmediatamente
      } else {
        alert(`Error al agregar comentario: ${resultado.error}`);
      }
    } catch (error) {
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditarComentario = async (comentarioId) => {
    if (!textoEditando.trim()) {
      alert('El comentario no puede estar vacío.');
      return;
    }

    setSaving(true);
    try {
      const resultado = await editarComentario(comentarioId, textoEditando.trim());
      
      if (resultado.success) {
        setComentarioEditando(null);
        setTextoEditando('');
      } else {
        alert(`Error al editar comentario: ${resultado.error}`);
      }
    } catch (error) {
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarComentario = async (comentarioId, autorNombre) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar este comentario?\n\nEsta acción no se puede deshacer.`)) {
      setSaving(true);
      try {
        const resultado = await eliminarComentario(comentarioId);
        
        if (resultado.success) {
          // El comentario desaparecerá automáticamente por el listener en tiempo real
        } else {
          alert(`Error al eliminar comentario: ${resultado.error}`);
        }
      } catch (error) {
        alert(`Error inesperado: ${error.message}`);
      } finally {
        setSaving(false);
      }
    }
  };

  const iniciarEdicion = (comentario) => {
    setComentarioEditando(comentario.id);
    setTextoEditando(comentario.texto);
  };

  const cancelarEdicion = () => {
    setComentarioEditando(null);
    setTextoEditando('');
  };

  const formatearFecha = (fecha) => {
    try {
      const fechaObj = fecha?.toDate ? fecha.toDate() : new Date(fecha);
      return fechaObj.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const puedeEditar = (comentario) => {
    return currentUser && comentario.autorUid === currentUser.uid;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <MessageCircle className="mr-3" size={28} />
                Comentarios - {institucion.nombre}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Espacio para notas, observaciones y comunicación del equipo
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-blue-100 hover:text-white transition-colors"
              disabled={saving}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex flex-col h-[600px]">
          
          {/* Lista de comentarios */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading && comentarios.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Cargando comentarios...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <AlertCircle size={32} className="mx-auto mb-2" />
                <p>Error al cargar comentarios: {error}</p>
              </div>
            ) : comentarios.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No hay comentarios aún</h3>
                <p className="text-gray-500">Sé el primero en dejar un comentario sobre esta institución.</p>
              </div>
            ) : (
              comentarios.map((comentario) => (
                <div key={comentario.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  
                  {/* Header del comentario */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{comentario.autorNombre}</div>
                        <div className="text-sm text-gray-500">{comentario.autorEmail}</div>
                      </div>
                    </div>
                    
                    {/* Acciones (solo para el autor) */}
                    {puedeEditar(comentario) && (
                      <div className="flex space-x-2">
                        {comentarioEditando === comentario.id ? (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditarComentario(comentario.id)}
                              className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                              title="Guardar cambios"
                              disabled={saving}
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={cancelarEdicion}
                              className="text-gray-600 hover:text-gray-800 p-1 rounded transition-colors"
                              title="Cancelar edición"
                              disabled={saving}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => iniciarEdicion(comentario)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Editar comentario"
                              disabled={saving}
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleEliminarComentario(comentario.id, comentario.autorNombre)}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                              title="Eliminar comentario"
                              disabled={saving}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contenido del comentario */}
                  <div className="mb-3">
                    {comentarioEditando === comentario.id ? (
                      <textarea
                        value={textoEditando}
                        onChange={(e) => setTextoEditando(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Edita tu comentario..."
                        disabled={saving}
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {comentario.texto}
                      </p>
                    )}
                  </div>

                  {/* Footer del comentario */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      <span>Publicado: {formatearFecha(comentario.fechaCreacion)}</span>
                    </div>
                    {comentario.fechaModificacion && (
                      <div className="flex items-center">
                        <Edit3 size={12} className="mr-1" />
                        <span>Editado: {formatearFecha(comentario.fechaModificacion)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Área para nuevo comentario */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">
                    Comentando como: <span className="font-medium">{currentUser?.displayName || currentUser?.email}</span>
                </div>
                <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAgregarComentario();
                    }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Escribe tu comentario... (Enter para enviar, Shift+Enter para nueva línea)"
                    disabled={saving}
                    maxLength="500"
                />
                <div className="flex justify-between items-center mt-3">
                    <div className="text-xs text-gray-500">
                    {nuevoComentario.length}/500 caracteres
                    </div>
                    <button
                    onClick={handleAgregarComentario}
                    disabled={saving || !nuevoComentario.trim() || nuevoComentario.length > 500}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {saving ? (
                        <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Enviando...
                        </>
                    ) : (
                        <>
                        <Send size={16} className="mr-2" />
                        Enviar
                        </>
                    )}
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Componente del botón para abrir comentarios
export const BotonComentarios = ({ institucion, comentariosCount = 0 }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="bg-yellow-400 text-white p-3 rounded-lg hover:bg-yellow-600 transition-colors relative"
        title="Ver y agregar comentarios"
      >
        <MessageCircle size={18} />
        {comentariosCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {comentariosCount > 9 ? '9+' : comentariosCount}
          </span>
        )}
      </button>

      {showModal && (
        <ModalComentarios 
          institucion={institucion}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default ModalComentarios;