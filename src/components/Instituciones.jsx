// src/components/Instituciones.jsx
import React, { useState } from 'react';
import { 
  Building, 
  PlusCircle, 
  X, 
  Trash2, 
  Calendar, 
  Users, 
  Edit3, 
  Plus,
  Loader2,
  History,
  Clock,
  Search,
  BarChart2
} from 'lucide-react';
import { useInstituciones } from '../hooks/useFirebase';
import { BotonComentarios } from './Comentarios';
import { useContadorComentarios } from '../hooks/useFirebase';
import { MessageCircle } from 'lucide-react';

const ModalAgregarInstitucion = ({ onClose, onSave }) => {
  const [nombre, setNombre] = useState('');
  const [consultas, setConsultas] = useState('');
  const [duracion, setDuracion] = useState(6);
  const [fechaInicio, setFechaInicio] = useState('');
  const [saving, setSaving] = useState(false);

  const obtenerFechaHoy = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  const asignarFechaHoy = () => {
    setFechaInicio(obtenerFechaHoy());
  };

  const handleSubmit = async () => {
    if (nombre.trim() && consultas > 0 && duracion > 0 && fechaInicio) {
      setSaving(true);
      const resultado = await onSave({ 
        nombre: nombre.trim(), 
        consultas: parseInt(consultas), 
        duracion: parseInt(duracion),
        fechaInicio: fechaInicio
      });
      
      if (resultado.success) {
        setNombre('');
        setConsultas('');
        setDuracion(6);
        setFechaInicio('');
        onClose();
        alert(`Institución "${nombre.trim()}" creada exitosamente!`);
      } else {
        alert(`Error al guardar: ${resultado.error}`);
      }
      setSaving(false);
    } else {
      alert("Por favor, complete todos los campos correctamente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Nueva Institución</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={saving}>
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Institución
            </label>
            <input 
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Cooperativa XYZ"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad de Consultas Asignadas
            </label>
            <input 
              type="number"
              value={consultas}
              onChange={(e) => setConsultas(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 120000"
              min="1"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración del Contrato (meses)
            </label>
            <select 
              value={duracion}
              onChange={(e) => setDuracion(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Inicio del Contrato
            </label>
            <div className="flex space-x-2">
              <input 
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              />
              <button
                type="button"
                onClick={asignarFechaHoy}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
                disabled={saving}
              >
                Hoy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Fecha desde la cual comenzarán a contar los {duracion} meses del contrato
            </p>
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
            <span>{saving ? 'Guardando...' : 'Guardar Institución'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalEditarInstitucion = ({ institucion, onClose, onSave }) => {
  const [nombre, setNombre] = useState(institucion.nombre);
  const [consultas, setConsultas] = useState(institucion.contrato.asignadas);
  const [duracion, setDuracion] = useState(institucion.contrato.duracionMeses);
  const [estado, setEstado] = useState(institucion.estado || 'activo');
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('');
  const [comentarioRenovacion, setComentarioRenovacion] = useState('');
  const [saving, setSaving] = useState(false);

  const obtenerFechaHoy = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  const validarFecha = (fecha) => {
    if (!fecha) return false;
    const fechaObj = new Date(fecha);
    return fechaObj instanceof Date && !isNaN(fechaObj);
  };

  const handleSubmit = async () => {
    if (nombre.trim() && consultas > 0 && duracion > 0) {
      if (estado === 'renovacion' && !nuevaFechaInicio) {
        alert("Por favor, selecciona la nueva fecha de inicio para la renovación.");
        return;
      }

      if (estado === 'renovacion' && !validarFecha(nuevaFechaInicio)) {
        alert("La fecha seleccionada no es válida. Por favor, selecciona una fecha correcta.");
        return;
      }

      if (estado === 'renovacion') {
        const confirmar = window.confirm(
          "¿Estás seguro de que deseas renovar este contrato?\n\n" +
          "• Se guardará el historial actual en el apartado Historial\n" +
          "• Se iniciará un nuevo período de contrato\n" +
          "• Los consumos mensuales se reiniciarán\n\n" +
          "Esta acción no se puede deshacer."
        );
        
        if (!confirmar) {
          return;
        }
      }

      setSaving(true);
      
      try {
        const datosActualizados = { 
          nombre: nombre.trim(), 
          consultas: parseInt(consultas), 
          duracion: parseInt(duracion),
          estado: estado
        };

        if (estado === 'renovacion' && nuevaFechaInicio) {
          const fechaFormateada = nuevaFechaInicio.includes('/') 
            ? nuevaFechaInicio.split('/').reverse().join('-') 
            : nuevaFechaInicio;
          datosActualizados.nuevaFechaInicio = fechaFormateada;
          
          if (comentarioRenovacion.trim()) {
            datosActualizados.comentarioRenovacion = comentarioRenovacion.trim();
          }
        }

        const resultado = await onSave(institucion.id, datosActualizados);
        
        if (resultado.success) {
          onClose();
          if (estado === 'renovacion') {
            alert(`Contrato renovado exitosamente!\n\nEl historial del período anterior está disponible en el apartado Historial.`);
          } else {
            alert(`Institución "${nombre.trim()}" actualizada exitosamente!`);
          }
        } else {
          alert(`Error al actualizar: ${resultado.error}`);
        }
      } catch (error) {
        console.error('Error en handleSubmit:', error);
        alert(`Error inesperado: ${error.message}`);
      }
      
      setSaving(false);
    } else {
      alert("Por favor, complete todos los campos correctamente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Editar Institución</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={saving}>
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Institución
            </label>
            <input 
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado del Contrato
            </label>
            <select 
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            >
              <option value="activo">Activo</option>
              <option value="pendiente">Pendiente</option>
              <option value="vencido">Vencido - No Renovado</option>
              <option value="renovacion">Renovación Contrato</option>
            </select>
            {estado === 'renovacion' && (
              <p className="text-sm text-blue-600 mt-2">
                Al renovar, el historial actual estará disponible en el apartado Historial
              </p>
            )}
          </div>

          {estado === 'renovacion' && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 space-y-4">
              <h4 className="text-sm font-medium text-blue-800 mb-3">Renovación de Contrato</h4>
              <p className="text-xs text-blue-600 mb-4">
                Se guardará el historial del periodo actual y se iniciará un nuevo contrato.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Fecha de Inicio
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="date"
                    value={nuevaFechaInicio}
                    onChange={(e) => setNuevaFechaInicio(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => setNuevaFechaInicio(obtenerFechaHoy())}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    disabled={saving}
                  >
                    Hoy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios de Renovación (Opcional)
                </label>
                <textarea 
                  value={comentarioRenovacion}
                  onChange={(e) => setComentarioRenovacion(e.target.value)}
                  placeholder="Ej: Renovación mismo plan desde 14/09/2025."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="3"
                  disabled={saving}
                  maxLength="500"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Este comentario se guardará en el historial
                  </p>
                  <p className="text-xs text-gray-400">
                    {comentarioRenovacion.length}/500
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad de Consultas Asignadas
            </label>
            <input 
              type="number"
              value={consultas}
              onChange={(e) => setConsultas(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
              disabled={saving}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración del Contrato (meses)
            </label>
            <select 
              value={duracion}
              onChange={(e) => setDuracion(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 font-medium ${
              estado === 'renovacion' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={saving}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            <span>
              {saving ? 'Actualizando...' : 
               estado === 'renovacion' ? 'Renovar Contrato' : 'Actualizar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalConsumoMensual = ({ institucion, onClose, onSave }) => {
  const [mes, setMes] = useState('');
  const [consumo, setConsumo] = useState('');
  const [saving, setSaving] = useState(false);

  const mesesDisponibles = () => {
    const meses = [];
    const consumoRegistrado = institucion.consumoPorMes || {};

    const rawInicio = institucion.contrato?.fechaInicio || institucion.fechaCreacion.split('/').reverse().join('-');
    const fechaInicio = new Date(rawInicio);

    let fechaFin;
    const rawFin = institucion.contrato?.fechaFin;
    if (rawFin && rawFin !== 'N/A') {
      if (rawFin.includes('/')) {
        const partes = rawFin.split('/');
        fechaFin = new Date(`${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`);
      } else {
        fechaFin = new Date(rawFin);
      }
    }

    if (!fechaFin || isNaN(fechaFin.getTime())) {
      fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaInicio.getMonth() + (institucion.contrato.duracionMeses || 6));
    }

    const mesInicio = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    const mesFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);

    const cursor = new Date(mesInicio);
    while (cursor <= mesFin) {
      const valor = `${cursor.getFullYear()}-${(cursor.getMonth() + 1).toString().padStart(2, '0')}`;
      const texto = cursor.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

      if (!(valor in consumoRegistrado)) {
        meses.push({ valor, texto });
      }

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return meses;
  };

  const mesesPendientes = mesesDisponibles();

  const handleSubmit = async () => {
    if (mes && consumo && parseInt(consumo) >= 0) {
      const consumoInt = parseInt(consumo);
      const disponible = institucion.contrato.asignadas - institucion.contrato.consumidas;
      
      if (consumoInt > disponible) {
        alert(`No puedes registrar más de ${disponible.toLocaleString()} consultas (disponibles).`);
        return;
      }

      setSaving(true);
      const resultado = await onSave(institucion.id, {
        mes,
        consumo: consumoInt
      });
      
      if (resultado.success) {
        setMes('');
        setConsumo('');
        onClose();
        alert(`Consumo de ${consumoInt.toLocaleString()} consultas registrado para ${mes}!`);
      } else {
        alert(`Error al registrar consumo: ${resultado.error}`);
      }
      setSaving(false);
    } else {
      alert("Por favor, complete todos los campos correctamente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Registrar Consumo Mensual</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={saving}>
            <X size={24} />
          </button>
        </div>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800">{institucion.nombre}</h3>
          <p className="text-sm text-blue-600">
            Consultas disponibles: {(institucion.contrato.asignadas - institucion.contrato.consumidas).toLocaleString()}
          </p>
        </div>

        {mesesPendientes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Todos los meses registrados!</h3>
            <p className="text-gray-600">
              Ya has registrado el consumo para todos los meses del contrato actual.
            </p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mes Pendiente
                </label>
                <select 
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={saving}
                >
                  <option value="">Seleccionar mes pendiente...</option>
                  {mesesPendientes.map((m) => (
                    <option key={m.valor} value={m.valor}>{m.texto}</option>
                  ))}
                </select>
                <p className="text-xs text-green-600 mt-1">
                  Solo se muestran los meses que aún no han sido registrados
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultas Consumidas en el Mes
                </label>
                <input 
                  type="number"
                  value={consumo}
                  onChange={(e) => setConsumo(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 5000"
                  min="0"
                  max={institucion.contrato.asignadas - institucion.contrato.consumidas}
                  disabled={saving}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Máximo disponible: {(institucion.contrato.asignadas - institucion.contrato.consumidas).toLocaleString()}
                </p>
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
                className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                disabled={saving}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                <span>{saving ? 'Registrando...' : 'Registrar Consumo'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ModalEditarConsumoMes = ({ institucion, mesSeleccionado, onClose, onSave }) => {
  const [consumo, setConsumo] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (mesSeleccionado && institucion.consumoPorMes) {
      const consumoActual = institucion.consumoPorMes[mesSeleccionado] || 0;
      setConsumo(consumoActual.toString());
    }
  }, [mesSeleccionado, institucion.consumoPorMes]);

  const handleSubmit = async () => {
    if (consumo && parseInt(consumo) >= 0) {
      const consumoInt = parseInt(consumo);
      
      const consumoOtrosMeses = Object.entries(institucion.consumoPorMes || {})
        .filter(([mes]) => mes !== mesSeleccionado)
        .reduce((sum, [, valor]) => sum + valor, 0);
      
      const disponible = institucion.contrato.asignadas - consumoOtrosMeses;
      
      if (consumoInt > disponible) {
        alert(`No puedes registrar más de ${disponible.toLocaleString()} consultas (disponibles considerando otros meses).`);
        return;
      }

      setSaving(true);
      const resultado = await onSave(institucion.id, {
        mes: mesSeleccionado,
        consumo: consumoInt
      });
      
      if (resultado.success) {
        onClose();
        alert(`Consumo actualizado: ${consumoInt.toLocaleString()} consultas para ${mesSeleccionado}!`);
      } else {
        alert(`Error al actualizar consumo: ${resultado.error}`);
      }
      setSaving(false);
    } else {
      alert("Por favor, ingresa un valor válido.");
    }
  };

  const fechaMes = new Date(mesSeleccionado + '-01');
  const nombreMes = fechaMes.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Editar Consumo Mensual</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={saving}>
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800">{institucion.nombre}</h3>
          <p className="text-sm text-blue-600">
            Editando consumo para: <strong>{nombreMes}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consultas Consumidas en {nombreMes}
            </label>
            <input 
              type="number"
              value={consumo}
              onChange={(e) => setConsumo(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 5000"
              min="0"
              disabled={saving}
            />
            <p className="text-sm text-gray-500 mt-1">
              Total asignadas: {institucion.contrato.asignadas?.toLocaleString()}
            </p>
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
            <span>{saving ? 'Actualizando...' : 'Actualizar Consumo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

{/* HISTORIAL */}
const ModalHistorial = ({ institucion, onClose }) => {
  const historial = institucion.historial || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <History className="mr-3 text-blue-600" size={28} />
            Historial de {institucion.nombre}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {historial.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Sin historial disponible</h3>
            <p className="text-gray-500">
              El historial aparecerá cuando se renueve el contrato de esta institución.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Período Actual */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-blue-800 flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                  Período Actual
                </h3>
                <span className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                  ACTIVO
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Inicio:</span>
                  <div className="font-medium text-gray-800">
                    {institucion.contrato?.fechaInicio ? 
                      new Date(institucion.contrato.fechaInicio).toLocaleDateString('es-ES') : 
                      institucion.fechaCreacion
                    }
                  </div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Vence:</span>
                  <div className="font-medium text-gray-800">{institucion.contrato?.fechaFin}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Consultas:</span>
                  <div className="font-medium text-gray-800">{institucion.contrato?.asignadas?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Consumidas:</span>
                  <div className="font-medium text-gray-800">{institucion.contrato?.consumidas?.toLocaleString()}</div>
                </div>
              </div>

              {/* Mostrar último comentario de renovación si existe */}
              {institucion.ultimaRenovacion?.comentario && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">💬</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-800">Comentario de Renovación</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(institucion.ultimaRenovacion.fecha).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          "{institucion.ultimaRenovacion.comentario}"
                        </p>
                        {institucion.ultimaRenovacion.renovadoPor && (
                          <p className="text-xs text-gray-500 mt-1">
                            Por: {institucion.ultimaRenovacion.renovadoPor}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Períodos Anteriores */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                Períodos Anteriores ({historial.length})
              </h3>
              
              <div className="space-y-4">
                {historial
                  .slice() 
                  .reverse() 
                  .map((periodo, reverseIndex) => {
                  const numeroPeriodo = historial.length - reverseIndex;
                  
                  return (
                    <div key={reverseIndex} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-800 flex items-center">
                          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-bold">{numeroPeriodo}</span>
                          </div>
                          Período #{numeroPeriodo}
                          {numeroPeriodo === 1 && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                              Primer Histórico
                            </span>
                          )}
                        </h4>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 block">Renovado:</span>
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(periodo.fechaRenovacion).toLocaleDateString('es-ES')}
                          </span>
                          {periodo.renovadoPor && (
                            <div className="text-xs text-gray-500 mt-1">
                              Por: {periodo.renovadoPor}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600 font-medium">Período:</span>
                          <div className="font-medium text-gray-800">
                            {new Date(periodo.periodoInicio).toLocaleDateString('es-ES')} - {new Date(periodo.periodoFin).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Duración:</span>
                          <div className="font-medium text-gray-800">{periodo.duracionMeses} meses</div>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Consultas Asignadas:</span>
                          <div className="font-medium text-gray-800">{periodo.consultasAsignadas?.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Consultas Consumidas:</span>
                          <div className="font-medium text-gray-800">{periodo.consultasConsumidas?.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* MOSTRAR COMENTARIO DE RENOVACIÓN */}
                      {periodo.comentario && (
                        <div className="mb-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs">💬</span>
                              </div>
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-gray-800 mb-1">Comentario de Renovación</h5>
                                <p className="text-sm text-gray-700 leading-relaxed italic">
                                  "{periodo.comentario}"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Consumo mensual del período */}
                      {periodo.consumoPorMes && Object.keys(periodo.consumoPorMes).length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Consumo Mensual del Período:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {Object.entries(periodo.consumoPorMes)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([mes, consumo]) => (
                              <div key={mes} className="bg-white p-3 rounded border text-center">
                                <div className="text-xs text-gray-600 font-medium">
                                  {new Date(mes + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                                </div>
                                <div className="font-bold text-sm text-gray-800">{consumo.toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Estadísticas del período */}
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-gray-800">
                              {periodo.consultasAsignadas > 0 ? 
                                ((periodo.consultasConsumidas / periodo.consultasAsignadas) * 100).toFixed(1) : 0
                              }%
                            </div>
                            <div className="text-xs text-gray-600">Porcentaje de Uso</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {(periodo.consultasAsignadas || 0) - (periodo.consultasConsumidas || 0)}
                            </div>
                            <div className="text-xs text-gray-600">Consultas No Utilizadas</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {Object.keys(periodo.consumoPorMes || {}).length}
                            </div>
                            <div className="text-xs text-gray-600">Meses Registrados</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end pt-6 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const Instituciones = ({ userRole }) => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComentariosModal, setShowComentariosModal] = useState(false);
  const [showConsumoModal, setShowConsumoModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showEditConsumoModal, setShowEditConsumoModal] = useState(false);
  const [institucionSeleccionada, setInstitucionSeleccionada] = useState(null);
  const [mesSeleccionadoParaEditar, setMesSeleccionadoParaEditar] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 🆕 ESTADOS PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 🆕 RESETEAR PÁGINA A 1 SI EL USUARIO BUSCA ALGO
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const ContadorComentarios = ({ institucionId }) => {
    const count = useContadorComentarios(institucionId);
    return count;
  };

  const { 
    instituciones, 
    loading, 
    error, 
    agregarInstitucion, 
    editarInstitucion,
    eliminarInstitucion,
    registrarConsumoMensual,
    editarConsumoMensual,
    eliminarConsumoMensual  
  } = useInstituciones();

  // Función para filtrar instituciones
  const institucionesFiltradas = instituciones.filter((institucion) => {
    const searchLower = searchTerm.toLowerCase();
    const nombreCoincide = institucion.nombre.toLowerCase().includes(searchLower);
    
    let estadoTexto = '';
    const estadoActual = institucion.estado || 'activo'; 
    
    switch(estadoActual) {
      case 'activo':
        estadoTexto = 'activo';
        break;
      case 'pendiente':
        estadoTexto = 'pendiente';
        break;
      case 'vencido':
        estadoTexto = 'vencido';
        break;
      case 'renovacion':
        estadoTexto = 'renovacion renovación';
        break;
      default:
        estadoTexto = 'activo'; 
    }
    
    const estadoCoincide = estadoTexto.includes(searchLower);
    
    return nombreCoincide || estadoCoincide;
  });

  // 🆕 LÓGICA DE PAGINACIÓN: Extraer solo los ítems de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = institucionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(institucionesFiltradas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSave = async (nuevaInstitucion) => {
    return await agregarInstitucion(nuevaInstitucion);
  };

  const handleEdit = async (id, datosActualizados) => {
    return await editarInstitucion(id, datosActualizados);
  };

  const handleConsumoMensual = async (id, datosConsumo) => {
    return await registrarConsumoMensual(id, datosConsumo);
  };

  const handleEditarConsumoMensual = async (id, datosConsumo) => {
    return await editarConsumoMensual(id, datosConsumo);
  };

  const handleEliminarConsumoMensual = async (institucion, mes) => {
    const consumo = institucion.consumoPorMes[mes];
    const nombreMes = new Date(mes + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    
    if (window.confirm(
      `¿Estás seguro de que quieres eliminar el consumo de ${nombreMes}?\n\n` +
      `• Institución: ${institucion.nombre}\n` +
      `• Consumo a eliminar: ${consumo.toLocaleString()} consultas\n` +
      `• Esta acción actualizará el total de consultas consumidas\n\n` +
      `Esta acción no se puede deshacer.`
    )) {
      const resultado = await eliminarConsumoMensual(institucion.id, mes);
      
      if (resultado.success) {
        alert(`Consumo de ${nombreMes} eliminado exitosamente!\n\nSe han restado ${consumo.toLocaleString()} consultas del total.`);
      } else {
        alert(`Error al eliminar consumo: ${resultado.error}`);
      }
    }
  };

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${nombre}"?`)) {
      const resultado = await eliminarInstitucion(id);
      
      if (resultado.success) {
        alert(`Institución "${nombre}" eliminada exitosamente!`);
      } else {
        alert(`Error al eliminar: ${resultado.error}`);
      }
    }
  };

  if (loading && instituciones.length === 0) {
    return (
      <div className="p-6 sm:p-10 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando instituciones desde Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-10 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200">
          <p className="text-red-600 font-medium">Error al conectar con Firebase</p>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building size={32} className="mr-3 text-blue-700"/>
            Gestión de Instituciones
          </h1>
          <p className="text-cyan-600 mt-1">
            {instituciones.length > 0 
              ? `${instituciones.length} Instituciones Registradas${searchTerm ? ` - ${institucionesFiltradas.length} Encontradas` : ''}`
              : 'No hay instituciones registradas'
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar instituciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {/* Botón Agregar */}
          <button 
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-5 py-3 rounded-lg font-semibold flex items-center hover:bg-green-700 transition-all shadow-sm whitespace-nowrap"
            disabled={loading}
          >
            <PlusCircle size={20} className="mr-2"/>
            Agregar Institución
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Users className="text-blue-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Total Instituciones</p>
              <p className="text-2xl font-bold text-gray-800">{instituciones.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Calendar className="text-green-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Contratos Activos</p>
              <p className="text-2xl font-bold text-gray-800">
                {instituciones.filter(inst => inst.estado === 'activo' || !inst.estado).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Clock className="text-yellow-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Instituciones Pendientes</p>
              <p className="text-2xl font-bold text-gray-800">
                {instituciones.filter(inst => inst.estado === 'pendiente').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <X className="text-red-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Vencido - No Renovado</p>
              <p className="text-2xl font-bold text-gray-800">
                {instituciones.filter(inst => inst.estado === 'vencido').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {institucionesFiltradas.length === 0 ? (
          searchTerm ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No se encontraron resultados</p>
              <p>No hay instituciones que coincidan con "{searchTerm}".</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
              <Building size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No hay instituciones registradas</p>
              <p>Haz clic en "Agregar Institución" para comenzar.</p>
            </div>
          )
        ) : (
          /* 🆕 ACA MAPEA SOLO LAS INSTITUCIONES DE LA PÁGINA ACTUAL (currentItems) */
          currentItems.map((institucion) => {
          let estadoBadge = 'bg-green-100 text-green-800';
          let estadoTexto = 'Activo';

          switch(institucion.estado) {
            case 'pendiente':
              estadoBadge = 'bg-yellow-100 text-yellow-800';
              estadoTexto = 'Pendiente';
              break;
            case 'vencido':
              estadoBadge = 'bg-red-100 text-red-800';
              estadoTexto = 'Vencido - No Renovado';
              break;
            case 'renovacion':
              estadoBadge = 'bg-blue-100 text-blue-800';
              estadoTexto = 'En Renovación';
              break;
            default:
              estadoBadge = 'bg-green-100 text-green-800';
              estadoTexto = 'Activo';
          }

            return (
              <div key={institucion.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-800">{institucion.nombre}</h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge}`}>
                        {estadoTexto}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Inicio: {institucion.contrato?.fechaInicio || institucion.fechaCreacion} | 
                      Vence: {institucion.contrato?.fechaFin} |
                      Duración: {institucion.contrato?.duracionMeses} meses
                    </p>
                    {institucion.historial && institucion.historial.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {institucion.historial.length} período(s) anterior(es) en historial
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 mt-2 sm:mt-0">
                    <button 
                      onClick={() => {
                        setInstitucionSeleccionada(institucion);
                        setShowConsumoModal(true);
                      }}
                      className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors"
                      title="Registrar consumo mensual"
                      disabled={loading}
                    >
                      <Plus size={18} />
                    </button>
                    {/* 🆕 NUEVO BOTÓN DE COMENTARIOS */}
                    <BotonComentarios 
                      institucion={institucion}
                      comentariosCount={0}
                    />
                    <button 
                      onClick={() => {
                        setInstitucionSeleccionada(institucion);
                        setShowEditModal(true);
                      }}
                      className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                      title="Editar institución"
                      disabled={loading}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setInstitucionSeleccionada(institucion);
                        setShowHistorialModal(true);
                      }}
                      className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors"
                      title="Ver historial de períodos"
                      disabled={loading}
                    >
                      <History size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(institucion.id, institucion.nombre)}
                      className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors"
                      title="Eliminar institución"
                      disabled={loading}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Títulos en negrita y color oscurecido (Pedido tuyo) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm font-bold text-gray-700">Consultas Asignadas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(institucion.contrato?.asignadas || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">Consultas Consumidas</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {(institucion.contrato?.consumidas || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">Consultas Restantes</p>
                    <p className="text-2xl font-bold text-green-600">
                      {((institucion.contrato?.asignadas || 0) - (institucion.contrato?.consumidas || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* --- SECCIÓN REDISEÑADA (Los cuadrados naranjas con números grandes) --- */}
                {institucion.consumoPorMes && Object.keys(institucion.consumoPorMes).length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <BarChart2 className="mr-2 text-orange-500" size={20} />
                      Consumo registrado por mes:
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {Object.entries(institucion.consumoPorMes)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([mes, consumo]) => (
                        <div 
                          key={mes} 
                          className="bg-gradient-to-br from-white to-orange-50 p-4 rounded-xl border-2 border-orange-100 shadow-sm text-center relative group hover:border-orange-300 transition-all duration-200"
                        >
                          <div className="text-xs font-bold text-orange-800 mb-1 uppercase tracking-widest opacity-80">
                            {new Date(mes + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                          </div>
                          
                          {/* TIPOGRAFÍA GIGANTE Y NEGRITA */}
                          <div className="text-3xl md:text-4xl font-black text-orange-600 drop-shadow-sm leading-none my-2">
                            {consumo.toLocaleString()}
                          </div>
                          
                          <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                            Consultas
                          </div>

                          {/* BOTONES DE EDICIÓN FLOTANTES */}
                          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button
                              onClick={() => {
                                setInstitucionSeleccionada(institucion);
                                setMesSeleccionadoParaEditar(mes);
                                setShowEditConsumoModal(true);
                              }}
                              className="bg-blue-100 text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-1.5 rounded-md shadow-sm transition-all duration-200"
                              title="Editar consumo del mes"
                              disabled={loading}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleEliminarConsumoMensual(institucion, mes)}
                              className="bg-red-100 text-red-600 hover:text-red-800 hover:bg-red-200 p-1.5 rounded-md shadow-sm transition-all duration-200"
                              title="Eliminar consumo del mes"
                              disabled={loading}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* --------------------------- */}
              </div>
            );
          })
        )}
        
        {/* 🆕 COMPONENTE UI DE PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-500 font-medium">
              Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, institucionesFiltradas.length)} de {institucionesFiltradas.length} instituciones
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Anterior
              </button>
              
              <div className="hidden sm:flex space-x-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`w-10 h-10 rounded-lg font-bold transition-colors text-sm ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 text-white shadow-md border border-blue-600' 
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
        {/* ------------------------------- */}
      </div>

      {showModal && (
        <ModalAgregarInstitucion 
          onClose={() => setShowModal(false)} 
          onSave={handleSave} 
        />
      )}

      {showEditModal && institucionSeleccionada && (
        <ModalEditarInstitucion 
          institucion={institucionSeleccionada}
          onClose={() => {
            setShowEditModal(false);
            setInstitucionSeleccionada(null);
          }} 
          onSave={handleEdit} 
        />
      )}

      {showConsumoModal && institucionSeleccionada && (
        <ModalConsumoMensual 
          institucion={institucionSeleccionada}
          onClose={() => {
            setShowConsumoModal(false);
            setInstitucionSeleccionada(null);
          }} 
          onSave={handleConsumoMensual} 
        />
      )}

      {showEditConsumoModal && institucionSeleccionada && mesSeleccionadoParaEditar && (
        <ModalEditarConsumoMes 
          institucion={institucionSeleccionada}
          mesSeleccionado={mesSeleccionadoParaEditar}
          onClose={() => {
            setShowEditConsumoModal(false);
            setInstitucionSeleccionada(null);
            setMesSeleccionadoParaEditar(null);
          }} 
          onSave={handleEditarConsumoMensual} 
        />
      )}

      {showComentariosModal && institucionSeleccionada && (
        <ModalComentarios 
          institucion={institucionSeleccionada}
          onClose={() => {
            setShowComentariosModal(false);
            setInstitucionSeleccionada(null);
          }} 
        />
      )}

      {showHistorialModal && institucionSeleccionada && (
        <ModalHistorial 
          institucion={institucionSeleccionada}
          onClose={() => {
            setShowHistorialModal(false);
            setInstitucionSeleccionada(null);
          }} 
        />
      )}
    </div>
  );
};

export default Instituciones;