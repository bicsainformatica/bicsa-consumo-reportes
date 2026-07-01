// src/components/Instituciones.jsx
import React, { useState, useEffect } from 'react';
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
  BarChart2,
  Filter,
  ShieldAlert,
  ClipboardList,
  FileSpreadsheet, // ✨ NUEVO ICONO EXCEL
  Tag,             // ✨ NUEVO ICONO CATEGORIA
  Download         // ✨ NUEVO ICONO DESCARGA
} from 'lucide-react';
import { useInstituciones } from '../hooks/useFirebase';
import { auth, db } from '../firebase';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { BotonComentarios } from './Comentarios';
import { sileo } from './sileo';
import { confirmar } from '../utils/confirmar';
import { useContadorComentarios } from '../hooks/useFirebase';
import { MessageCircle } from 'lucide-react';
import * as XLSX from 'xlsx'; // ✨ IMPORT EXCEL OBLIGATORIO
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from 'recharts';

const ModalAgregarInstitucion = ({ onClose, onSave }) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('BUSINESS Micro'); // ✨ NUEVO ESTADO CATEGORIA
  const [consultas, setConsultas] = useState('');
  const [duracion, setDuracion] = useState(6);
  const [fechaInicio, setFechaInicio] = useState('');
  const [saving, setSaving] = useState(false);
  const [montoTotal, setMontoTotal] = useState('');
  const [plazoMeses, setPlazoMeses] = useState('1');

  const obtenerFechaHoy = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  const asignarFechaHoy = () => {
    setFechaInicio(obtenerFechaHoy());
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) return sileo.warning({ title: 'Campo requerido', description: 'Falta completar el Nombre de la Institución.' });
    if (montoTotal === '' || parseFloat(montoTotal) < 0) return sileo.warning({ title: 'Campo requerido', description: 'Falta completar el Monto Total (puede ser 0 pero no vacío).' });
    if (!consultas || parseInt(consultas) <= 0) return sileo.warning({ title: 'Campo requerido', description: 'Falta completar la Cantidad de Consultas Asignadas (mayor a 0).' });
    if (!duracion || parseInt(duracion) <= 0) return sileo.warning({ title: 'Campo requerido', description: 'Falta seleccionar la Duración del Contrato.' });
    if (!fechaInicio) return sileo.warning({ title: 'Campo requerido', description: 'Falta seleccionar la Fecha de Inicio del Contrato.' });

    setSaving(true);
    const resultado = await onSave({ 
      nombre: nombre.trim(), 
      categoria,
      consultas: parseInt(consultas), 
      duracion: parseInt(duracion),
      fechaInicio: fechaInicio,
      montoTotal: parseFloat(montoTotal) || 0,
      plazoMeses: parseInt(plazoMeses) || 1
    });
    
    if (resultado.success) {
      setNombre('');
      setCategoria('BUSINESS Micro');
      setMontoTotal('');
      setPlazoMeses('1');
      setConsultas('');
      setDuracion(6);
      setFechaInicio('');
      onClose();
      sileo.success({ title: 'Institución creada', description: `"${nombre.trim()}" fue registrada exitosamente.` });
    } else {
      sileo.error({ title: 'Error al guardar', description: resultado.error });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ej: Cooperativa XYZ"
              disabled={saving}
            />
          </div>
          
          {/* ✨ NUEVO CAMPO CATEGORÍA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan / Categoría
            </label>
            <select 
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={saving}
            >
              <option value="BUSINESS Micro">BUSINESS Micro</option>
              <option value="BUSINESS Pequeña">BUSINESS Pequeña</option>
              <option value="BUSINESS Mediana">BUSINESS Mediana</option>
              <option value="Plan Premium">Plan Premium</option>
              <option value="Plan Premium Gold">Plan Premium Gold</option>
            </select>
          </div>

          {/* ✨ NUEVOS CAMPOS FINANCIEROS */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total (Gs)</label>
              <input type="number" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: 1500000" disabled={saving} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plazo de Pago</label>
              <select value={plazoMeses} onChange={(e) => setPlazoMeses(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" disabled={saving}>
                <option value="1">1 Mes (Al contado)</option>
                {[2,3,4,5,6,7,8,9,10,11,12].map(num => (
                  <option key={num} value={num}>{num} Meses</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad de Consultas Asignadas
            </label>
            <input 
              type="number"
              value={consultas}
              onChange={(e) => setConsultas(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={saving}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'mes' : 'meses'}</option>
              ))}
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
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
  const [categoria, setCategoria] = useState(institucion.categoria || 'Sin Categoría'); // ✨ ESTADO CATEGORIA
  const [montoTotal, setMontoTotal] = useState(institucion.montoTotal || ''); // ✨ NUEVO
  const [plazoMeses, setPlazoMeses] = useState(institucion.plazoMeses || '1'); // ✨ NUEVO
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
        sileo.warning({ title: 'Fecha requerida', description: 'Por favor, selecciona la nueva fecha de inicio para la renovación.' });
        return;
      }

      if (estado === 'renovacion' && !validarFecha(nuevaFechaInicio)) {
        sileo.error({ title: 'Fecha inválida', description: 'La fecha seleccionada no es válida. Por favor, selecciona una fecha correcta.' });
        return;
      }

      const ejecutarGuardado = async () => {
        setSaving(true);
        try {
          const datosActualizados = { 
            nombre: nombre.trim(), 
            categoria,
            consultas: parseInt(consultas), 
            duracion: parseInt(duracion),
            estado: estado,
            montoTotal: parseFloat(montoTotal) || 0,
            plazoMeses: parseInt(plazoMeses) || 1
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
              sileo.success({ title: 'Contrato renovado', description: 'El historial del período anterior está disponible en el apartado Historial.' });
            } else {
              sileo.success({ title: 'Institución actualizada', description: `"${nombre.trim()}" fue actualizada exitosamente.` });
            }
          } else {
            sileo.error({ title: 'Error al actualizar', description: resultado.error });
          }
        } catch (error) {
          console.error('Error en handleSubmit:', error);
          sileo.error({ title: 'Error inesperado', description: error.message });
        }
        setSaving(false);
      };

      if (estado === 'renovacion') {
        confirmar(
          'Renovar contrato',
          'Se guardará el historial actual y se iniciará un nuevo período. Los consumos mensuales se reiniciarán. Esta acción no se puede deshacer.',
          ejecutarGuardado
        );
      } else {
        await ejecutarGuardado();
      }

    } else {
      sileo.warning({ title: 'Campos incompletos', description: 'Por favor, complete todos los campos correctamente.' });
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={saving}
            />
          </div>

          {/* ✨ NUEVO CAMPO CATEGORÍA EDITAR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan / Categoría
            </label>
            <select 
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={saving}
            >
              <option value="BUSINESS Micro">BUSINESS Micro</option>
              <option value="BUSINESS Pequeña">BUSINESS Pequeña</option>
              <option value="BUSINESS Mediana">BUSINESS Mediana</option>
              <option value="Plan Premium">Plan Premium</option>
              <option value="Plan Premium Gold">Plan Premium Gold</option>
              {(!institucion.categoria || institucion.categoria === 'Sin Categoría') && (
                <option value="Sin Categoría">Sin Categoría (Requiere Actualizar)</option>
              )}
            </select>
          </div>

          {/* ✨ NUEVOS CAMPOS FINANCIEROS */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total (Gs)</label>
              <input type="number" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: 1500000" disabled={saving} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plazo de Pago</label>
              <select value={plazoMeses} onChange={(e) => setPlazoMeses(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" disabled={saving}>
                <option value="1">1 Mes (Al contado)</option>
                {[2,3,4,5,6,7,8,9,10,11,12].map(num => (
                  <option key={num} value={num}>{num} Meses</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado del Contrato
            </label>
            <select 
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={saving}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'mes' : 'meses'}</option>
              ))}
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
        sileo.warning({ title: 'Excede el límite', description: `No puedes registrar más de ${disponible.toLocaleString()} consultas disponibles.` });
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
        sileo.success({ title: 'Consumo registrado', description: `${consumoInt.toLocaleString()} consultas registradas para ${mes}.` });
      } else {
        sileo.error({ title: 'Error al registrar', description: resultado.error });
      }
      setSaving(false);
    } else {
      sileo.warning({ title: 'Campos incompletos', description: 'Por favor, complete todos los campos correctamente.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: 5000"
                  min="0"
                  max={institucion.contrato.asignadas - institucion.contrato.consumidas}
                  disabled={saving}
                />
                <div className="flex justify-between items-center mt-2 text-sm bg-gray-50 p-2 rounded border border-gray-100">
                  <span className="text-gray-600">
                    Máx. disponible: <span className="font-semibold text-gray-800">{(institucion.contrato.asignadas - institucion.contrato.consumidas).toLocaleString()}</span>
                  </span>
                  <span className={`font-bold ${(institucion.contrato.asignadas - institucion.contrato.consumidas - (parseInt(consumo) || 0)) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    Restante: {(institucion.contrato.asignadas - institucion.contrato.consumidas - (parseInt(consumo) || 0)).toLocaleString()}
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
        sileo.warning({ title: 'Excede el límite', description: `No puedes registrar más de ${disponible.toLocaleString()} consultas disponibles considerando otros meses.` });
        return;
      }

      setSaving(true);
      const resultado = await onSave(institucion.id, {
        mes: mesSeleccionado,
        consumo: consumoInt
      });
      
      if (resultado.success) {
        onClose();
        sileo.success({ title: 'Consumo actualizado', description: `${consumoInt.toLocaleString()} consultas registradas para ${mesSeleccionado}.` });
      } else {
        sileo.error({ title: 'Error al actualizar', description: resultado.error });
      }
      setSaving(false);
    } else {
      sileo.warning({ title: 'Valor inválido', description: 'Por favor, ingresa un valor válido.' });
    }
  };

  const fechaMes = new Date(mesSeleccionado + '-01T00:00:00');
  const nombreMes = fechaMes.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

  const consumoOtrosMeses = Object.entries(institucion.consumoPorMes || {})
    .filter(([m]) => m !== mesSeleccionado)
    .reduce((sum, [, valor]) => sum + valor, 0);
  const maxDisponibleParaEditar = (institucion.contrato.asignadas || 0) - consumoOtrosMeses;
  const restanteDinamico = maxDisponibleParaEditar - (parseInt(consumo) || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: 5000"
              min="0"
              disabled={saving}
            />
            <div className="flex justify-between items-center mt-2 text-sm bg-gray-50 p-2 rounded border border-gray-100">
              <span className="text-gray-600">
                Máx. disp: <span className="font-semibold text-gray-800">{maxDisponibleParaEditar.toLocaleString()}</span>
              </span>
              <span className={`font-bold ${restanteDinamico < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                Restante: {restanteDinamico.toLocaleString()}
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
            <span>{saving ? 'Actualizando...' : 'Actualizar Consumo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

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
            {/* LTV Acumulado (Punto 4) */}
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between shadow-sm">
              <div className="mb-2 md:mb-0">
                <h3 className="text-emerald-800 font-bold text-lg flex items-center">
                  <span className="bg-emerald-200 p-1.5 rounded-full mr-2">💰</span>
                  Historial Financiero (LTV Acumulado)
                </h3>
                <p className="text-emerald-700 text-sm mt-1">Valor histórico total invertido por este cliente sumando todos sus períodos documentados.</p>
              </div>
              <div className="text-3xl font-black text-emerald-700 tracking-tight text-right drop-shadow-sm">
                {((institucion.montoTotal || 0) + historial.reduce((sum, p) => sum + (p.montoTotal || institucion.montoTotal || 0), 0)).toLocaleString()} Gs
              </div>
            </div>

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

                      {periodo.consumoPorMes && Object.keys(periodo.consumoPorMes).length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Consumo Mensual del Período:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {Object.entries(periodo.consumoPorMes)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([mes, consumo]) => (
                              <div key={mes} className="bg-white p-3 rounded border text-center">
                                <div className="text-xs text-gray-600 font-medium">
                                  {new Date(mes + '-01T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                                </div>
                                <div className="font-bold text-sm text-gray-800">{consumo.toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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

const ModalAuditoria = ({ institucion, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const q = query(
      collection(db, 'auditoria'), 
      where('institucionId', '==', institucion.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = [];
      snapshot.forEach(doc => logData.push({ id: doc.id, ...doc.data() }));
      logData.sort((a, b) => (b.fecha?.toMillis() || 0) - (a.fecha?.toMillis() || 0));
      setLogs(logData);
      setLoading(false);
    }, (error) => {
      console.error("Error cargando logs:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [institucion.id]);

  const logsFiltrados = logs.filter(log => {
    if (!log.fecha) return true;
    const logDate = log.fecha.toDate();
    logDate.setHours(0,0,0,0);
    
    if (fechaDesde) {
      const desde = new Date(fechaDesde + 'T00:00:00');
      if (logDate < desde) return false;
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta + 'T00:00:00');
      if (logDate > hasta) return false;
    }
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logsFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(logsFiltrados.length / itemsPerPage);

  const exportarExcel = () => {
    try {
      const dataToExport = logsFiltrados.map(log => ({
        Fecha: log.fecha?.toDate()?.toLocaleString('es-ES') || 'Reciente',
        Acción: log.accion,
        Detalles: log.detalles,
        Usuario: log.usuario
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Auditoría');
      XLSX.writeFile(wb, `Auditoria_${institucion.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch(e) {
      sileo.error({ title: 'Error al exportar', description: 'No se pudo generar el archivo Excel.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <ClipboardList className="mr-3 text-indigo-600" size={28} />
              Auditoría de Movimientos
            </h2>
            <p className="text-sm text-gray-500 mt-1">Historial de acciones en: <strong>{institucion.nombre}</strong></p>
          </div>
          <div className="flex space-x-2">
            <button onClick={exportarExcel} disabled={logsFiltrados.length === 0} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold text-sm transition-colors">
              <Download size={16} className="mr-2" /> Excel
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex space-x-4 mb-4 shrink-0 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Desde:</label>
            <input type="date" value={fechaDesde} onChange={e => {setFechaDesde(e.target.value); setCurrentPage(1);}} className="w-full mt-1 p-2 border rounded text-sm outline-none"/>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Hasta:</label>
            <input type="date" value={fechaHasta} onChange={e => {setFechaHasta(e.target.value); setCurrentPage(1);}} className="w-full mt-1 p-2 border rounded text-sm outline-none"/>
          </div>
          <div className="flex items-end pb-1">
            <button onClick={() => {setFechaDesde(''); setFechaHasta(''); setCurrentPage(1);}} className="text-sm text-blue-600 font-bold hover:underline">Limpiar Filtros</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {loading ? (
            <div className="text-center py-10"><Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} /></div>
          ) : currentLogs.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-medium bg-gray-50 rounded-lg">No se encontraron movimientos registrados.</div>
          ) : (
            currentLogs.map(log => (
              <div key={log.id} className="bg-white p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm flex items-start space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-gray-800 text-sm">{log.accion}</p>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {log.fecha?.toDate ? log.fecha.toDate().toLocaleString('es-ES') : 'Reciente'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{log.detalles}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Por: {log.usuario}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 pt-4 border-t flex justify-between items-center shrink-0">
            <span className="text-sm text-gray-500 font-medium">Página {currentPage} de {totalPages}</span>
            <div className="flex space-x-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 text-sm font-bold text-gray-700">Anterior</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 text-sm font-bold text-gray-700">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Instituciones = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConsumoModal, setShowConsumoModal] = useState(false);
  const [showEditConsumoModal, setShowEditConsumoModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showAuditoriaModal, setShowAuditoriaModal] = useState(false);
  const [institucionSeleccionada, setInstitucionSeleccionada] = useState(null);
  const [mesSeleccionadoParaEditar, setMesSeleccionadoParaEditar] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); 
  const [filtroCategoria, setFiltroCategoria] = useState('todos'); // ✨ NUEVO FILTRO CATEGORIA
  const [filtroAlerta, setFiltroAlerta] = useState('todas'); // ✨ NUEVO FILTRO ALERTA (Punto 1)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [userRol, setUserRol] = useState(null);
  const [permisos, setPermisos] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const unsubscribe = onSnapshot(doc(db, 'usuarios', currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          setUserRol(docSnap.data().rol);
          setPermisos(docSnap.data().permisos);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const canAdd = userRol === 'admin' || permisos?.instituciones?.agregar;
  const canEdit = userRol === 'admin' || permisos?.instituciones?.editar;
  const canDelete = userRol === 'admin' || permisos?.instituciones?.eliminar;
  const canConsume = userRol === 'admin' || permisos?.instituciones?.registrarConsumo;
  const canComment = userRol === 'admin' || permisos?.instituciones?.comentar;
  const canHistory = userRol === 'admin' || permisos?.instituciones?.verHistorial;

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

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroEstado, filtroCategoria, filtroAlerta]);

  // ✨ LOGICA DE FILTROS COMBINADOS (Buscador + Estado + Categoria + Alerta)
  const institucionesFiltradas = instituciones.filter((institucion) => {
    const searchLower = searchTerm.toLowerCase();
    const coincideBusqueda = institucion.nombre.toLowerCase().includes(searchLower);

    let coincideFiltroEstado = true;
    if (filtroEstado !== 'todos') {
      const estadoReal = institucion.estado || 'activo';
      if (filtroEstado !== estadoReal) coincideFiltroEstado = false;
    }

    let coincideFiltroCategoria = true;
    if (filtroCategoria !== 'todos') {
      const catReal = institucion.categoria || 'Sin Categoría';
      if (filtroCategoria === 'Sin Categoría' && catReal !== 'Sin Categoría') coincideFiltroCategoria = false;
      else if (filtroCategoria !== 'Sin Categoría' && catReal !== filtroCategoria) coincideFiltroCategoria = false;
    }

    let coincideFiltroAlerta = true;
    if (filtroAlerta !== 'todas') {
      const consumidas = institucion.contrato?.consumidas || 0;
      const asignadas = institucion.contrato?.asignadas || 0;
      const porcentaje = asignadas > 0 ? (consumidas / asignadas) * 100 : 0;
      
      let diasRestantes = 999;
      if (institucion.contrato?.fechaFin && institucion.contrato.fechaFin !== 'N/A') {
        let fechaFinObj;
        if (institucion.contrato.fechaFin.includes('/')) {
           const partes = institucion.contrato.fechaFin.split('/');
           fechaFinObj = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        } else {
           fechaFinObj = new Date(institucion.contrato.fechaFin);
        }
        const diffTime = fechaFinObj - new Date();
        diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      if (filtroAlerta === 'consumo_alto') {
        if (porcentaje < 75) coincideFiltroAlerta = false;
      } else if (filtroAlerta === 'vencimiento_cercano') {
        // Expirado (0 o menos) o en los proximos 15 dias, PERO excluir los que YA fueron pasados a estado vencido
        if (diasRestantes > 15 || institucion.estado === 'vencido' || institucion.estado === 'no_renovada') coincideFiltroAlerta = false;
      }
    }

    return coincideBusqueda && coincideFiltroEstado && coincideFiltroCategoria && coincideFiltroAlerta;
  });

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
    const nombreMes = new Date(mes + '-01T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    confirmar(
      `Eliminar consumo de ${nombreMes}`,
      `Se eliminarán ${consumo.toLocaleString()} consultas registradas para "${institucion.nombre}". Esta acción no se puede deshacer.`,
      async () => {
        const resultado = await eliminarConsumoMensual(institucion.id, mes);
        if (resultado.success) {
          sileo.success({ title: 'Consumo eliminado', description: `Consumo de ${nombreMes} eliminado. Se restaron ${consumo.toLocaleString()} consultas.` });
        } else {
          sileo.error({ title: 'Error al eliminar consumo', description: resultado.error });
        }
      }
    );
  };

  const handleDelete = async (id, nombre) => {
    confirmar(
      'Eliminar institución',
      `¿Estás seguro de que quieres eliminar "${nombre}"? Esta acción no se puede deshacer.`,
      async () => {
        const resultado = await eliminarInstitucion(id);
        if (resultado.success) {
          sileo.success({ title: 'Institución eliminada', description: `"${nombre}" fue eliminada exitosamente.` });
        } else {
          sileo.error({ title: 'Error al eliminar', description: resultado.error });
        }
      }
    );
  };

  // ✨ NUEVA FUNCION: DESCARGAR EXCEL DE LOS FILTROS ACTUALES
  const exportarExcelFiltrado = () => {
    if (institucionesFiltradas.length === 0) return sileo.warning({ title: 'Sin datos', description: 'No hay datos para exportar con estos filtros.' });
    
    const data = institucionesFiltradas.map((inst, index) => ({
      'Nro': index + 1,
      'Institución': inst.nombre,
      'Plan / Categoría': inst.categoria || 'Sin Categoría',
      'Monto Total (Gs)': inst.montoTotal || 0,
      'Plazo Meses': inst.plazoMeses || 1,
      'Estado': inst.estado === 'no_renovada' ? 'FINALIZADA' : (inst.estado || 'activo').toUpperCase(),
      'Asignadas': inst.contrato?.asignadas || 0,
      'Consumidas': inst.contrato?.consumidas || 0,
      'Restantes': (inst.contrato?.asignadas || 0) - (inst.contrato?.consumidas || 0),
      'Uso (%)': inst.contrato?.asignadas > 0 ? `${((inst.contrato.consumidas / inst.contrato.asignadas) * 100).toFixed(1)}%` : '0%',
      'Fecha Inicio': inst.contrato?.fechaInicio || inst.fechaCreacion,
      'Fecha Venc.': inst.contrato?.fechaFin || 'N/A',
      'Meses Contrato': inst.contrato?.duracionMeses || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{wch: 5}, {wch: 35}, {wch: 20}, {wch: 15}, {wch: 10}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 10}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Instituciones');
    XLSX.writeFile(wb, `Reporte_Instituciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading && instituciones.length === 0) {
    return (
      <div className="p-6 sm:p-10 bg-slate-50 min-h-screen flex items-center justify-center relative overflow-hidden grid-overlay">
        <div className="text-center relative z-10">
          <Loader2 size={48} className="animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Cargando instituciones desde Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-10 bg-slate-50 min-h-screen flex items-center justify-center relative overflow-hidden grid-overlay">
        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-200 max-w-md shadow-lg relative z-10 backdrop-blur-md">
          <p className="text-red-800 font-bold text-lg mb-2">Error al conectar con Firebase</p>
          <p className="text-red-655 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 flex items-center justify-center mx-auto font-bold transition-all active:scale-95 shadow-lg shadow-red-600/10"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 bg-slate-50 min-h-screen relative overflow-hidden grid-overlay">
      {/* Background Glow Spots */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full blur-[150px] glow-spot-orange pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-[150px] glow-spot-purple pointer-events-none"></div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 space-y-4 xl:space-y-0 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center tracking-tight">
            <Building size={32} className="mr-3 text-brand-500"/>
            Gestión de Instituciones
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {institucionesFiltradas.length} resultados encontrados
          </p>
        </div>
        
        {/* BARRA DE HERRAMIENTAS REESTRUCTURADA */}
        <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 w-full xl:w-auto relative z-10">
          
          <div className="relative w-full md:w-56">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar institución..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm text-sm transition-all" />
          </div>

          <div className="relative w-full md:w-44">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium shadow-sm appearance-none cursor-pointer transition-all">
              <option value="todos">Todos los Estados</option>
              <option value="activo">Solo Activos</option>
              <option value="pendiente">Solo Pendientes</option>
              <option value="vencido">Solo Vencidos</option>
            </select>
          </div>

          {/* ✨ NUEVO FILTRO CATEGORÍA */}
          <div className="relative w-full md:w-56">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium shadow-sm appearance-none cursor-pointer transition-all">
              <option value="todos">Todas las Categorías</option>
              <option value="BUSINESS Micro">BUSINESS Micro</option>
              <option value="BUSINESS Pequeña">BUSINESS Pequeña</option>
              <option value="BUSINESS Mediana">BUSINESS Mediana</option>
              <option value="Plan Premium">Plan Premium</option>
              <option value="Plan Premium Gold">Plan Premium Gold</option>
              <option value="Sin Categoría">Sin Categoría</option>
            </select>
          </div>
          
          {/* ✨ BOTONES DE ALERTA RÁPIDA */}
          <div className="flex space-x-2 w-full md:w-auto overflow-hidden">
            <button
              onClick={() => setFiltroAlerta(filtroAlerta === 'consumo_alto' ? 'todas' : 'consumo_alto')}
              className={`flex-1 md:flex-none flex items-center px-3 py-2.5 rounded-xl text-sm font-bold border transition-all shadow-sm whitespace-nowrap active:scale-95 ${filtroAlerta === 'consumo_alto' ? 'bg-red-100 border-red-200 text-red-800' : 'bg-white border border-slate-200 text-slate-655 hover:bg-slate-50 hover:text-slate-800'}`}
              title="Filtrar instituciones con uso avanzado (>= 75%)"
            >
              ⚠️ <span className="hidden md:inline ml-1 font-extrabold text-xs tracking-wider">ALTO CONSUMO</span>
            </button>
            <button
              onClick={() => setFiltroAlerta(filtroAlerta === 'vencimiento_cercano' ? 'todas' : 'vencimiento_cercano')}
              className={`flex-1 md:flex-none flex items-center px-3 py-2.5 rounded-xl text-sm font-bold border transition-all shadow-sm whitespace-nowrap active:scale-95 ${filtroAlerta === 'vencimiento_cercano' ? 'bg-brand-100 border-brand-200 text-brand-850' : 'bg-white border border-slate-200 text-slate-655 hover:bg-slate-50 hover:text-slate-850'}`}
              title="Filtrar instituciones que vencen en 15 días o menos"
            >
              ⏱️ <span className="hidden md:inline ml-1 font-extrabold text-xs tracking-wide">POR VENCER</span>
            </button>
          </div>
          <div className="flex space-x-2 w-full md:w-auto">
            {/* ✨ BOTON EXCEL FILTRADO */}
            <button onClick={exportarExcelFiltrado} className="flex-1 md:flex-none bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-emerald-700 shadow-lg shadow-emerald-600/10 transition-all active:scale-95 text-sm" title="Descargar Excel del listado filtrado">
              <FileSpreadsheet size={18} className="md:mr-2"/> <span className="hidden md:inline">Excel</span>
            </button>
            
            {canAdd && (
              <button onClick={() => setShowModal(true)} className="flex-1 md:flex-none bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-brand-700 shadow-lg shadow-brand-500/10 transition-all active:scale-95 whitespace-nowrap text-sm">
                <PlusCircle size={18} className="md:mr-2"/> <span className="hidden md:inline">Nuevo</span>
              </button>
            )}
          </div>

        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex items-center shadow-md">
          <Users className="text-brand-500 mr-3" size={24} />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Instituciones</p>
            <p className="text-2xl font-black text-slate-800">{instituciones.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex items-center shadow-md">
          <Calendar className="text-emerald-500 mr-3" size={24} />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contratos Activos</p>
            <p className="text-2xl font-black text-slate-800">
              {instituciones.filter(inst => inst.estado === 'activo' || !inst.estado).length}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex items-center shadow-md">
          <Clock className="text-amber-500 mr-3" size={24} />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Instituciones Pendientes</p>
            <p className="text-2xl font-black text-slate-800">
              {instituciones.filter(inst => inst.estado === 'pendiente').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex items-center shadow-md">
          <X className="text-red-500 mr-3" size={24} />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vencido - No Renovado</p>
            <p className="text-2xl font-black text-slate-800">
              {instituciones.filter(inst => inst.estado === 'vencido').length}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {institucionesFiltradas.length === 0 ? (
          searchTerm || filtroEstado !== 'todos' || filtroCategoria !== 'todos' ? (
            <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-200/80 shadow-md">
              <Search size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-bold text-slate-800 mb-2">No se encontraron resultados</p>
              <p className="text-slate-500">No hay instituciones que coincidan con los filtros aplicados.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFiltroEstado('todos');
                  setFiltroCategoria('todos');
                }}
                className="mt-6 text-brand-600 hover:text-brand-700 font-bold bg-brand-50 border border-brand-100 hover:bg-brand-100 px-5 py-2.5 rounded-xl transition-all active:scale-95 text-sm"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-200/80 shadow-md">
              <Building size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-bold text-slate-800 mb-2">No hay instituciones registradas</p>
              <p className="text-slate-500">Haz clic en "Nuevo" para comenzar.</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {currentItems.map((institucion) => {
            let estadoBadge = 'bg-emerald-100 text-emerald-850 border border-emerald-200';
            let estadoTexto = 'Activo';
            let accentColor = 'bg-emerald-500';

            switch(institucion.estado) {
              case 'pendiente':
                estadoBadge = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
                estadoTexto = 'Pendiente';
                accentColor = 'bg-yellow-500';
                break;
              case 'vencido':
                estadoBadge = 'bg-red-100 text-red-800 border border-red-200';
                estadoTexto = 'Vencido - No Renovado';
                accentColor = 'bg-red-500';
                break;
              case 'renovacion':
                estadoBadge = 'bg-blue-100 text-blue-800 border border-blue-200';
                estadoTexto = 'En Renovación';
                accentColor = 'bg-blue-500';
                break;
              default:
                estadoBadge = 'bg-emerald-100 text-emerald-850 border border-emerald-200';
                estadoTexto = 'Activo';
                accentColor = 'bg-emerald-500';
            }

            // ✨ COLOR DEL BADGE DE CATEGORÍA
            let catColor = 'bg-slate-100 text-slate-700 border-slate-200';
            if(institucion.categoria?.includes('BUSINESS')) catColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
            if(institucion.categoria?.includes('Premium')) catColor = 'bg-amber-100 text-amber-800 border-amber-250';

            // Cálculo de porcentaje de uso
            const asignadas = institucion.contrato?.asignadas || 0;
            const consumidas = institucion.contrato?.consumidas || 0;
            const restantes = asignadas - consumidas;
            const porcentajeUso = asignadas > 0 ? Math.min((consumidas / asignadas) * 100, 100) : 0;
            const barColor = porcentajeUso >= 90 ? 'bg-red-500' : porcentajeUso >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <div key={institucion.id} className="bg-white rounded-xl border border-slate-200/80 hover:border-brand-500/30 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
                  
                  {/* Accent bar superior por estado */}
                  <div className={`h-1 w-full ${accentColor}`} />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Header: nombre + badges + acciones */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                          <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-tight leading-tight">{institucion.nombre}</h2>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {/* ✨ BADGE CATEGORÍA EN LA TARJETA */}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shadow-sm ${catColor}`}>
                            {institucion.categoria || 'Sin Categoría'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${estadoBadge}`}>
                            {estadoTexto}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Inicio: <span className="text-slate-700 font-semibold">{institucion.contrato?.fechaInicio || institucion.fechaCreacion}</span>{' '}|
                          {' '}Vence: <span className="text-slate-700 font-semibold">{institucion.contrato?.fechaFin}</span>{' '}|
                          {' '}Plazo: <span className="text-slate-700 font-semibold">{institucion.plazoMeses || 1} {(institucion.plazoMeses || 1) === 1 ? 'mes' : 'meses'}</span>
                        </p>
                        {institucion.historial && institucion.historial.length > 0 && (
                          <p className="text-xs text-brand-700 mt-1 font-medium">
                            📋 {institucion.historial.length} período(s) anterior(es) en historial
                          </p>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        {canConsume && (
                          <button 
                            onClick={() => { setInstitucionSeleccionada(institucion); setShowConsumoModal(true); }}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white p-2 rounded-lg border border-emerald-250 hover:border-emerald-600 transition-all shadow-sm active:scale-95"
                            title="Registrar consumo mensual" disabled={loading}
                          >
                            <Plus size={16} />
                          </button>
                        )}
                        {canComment && (
                          <BotonComentarios institucion={institucion} comentariosCount={0} />
                        )}
                        {canEdit && (
                          <button 
                            onClick={() => { setInstitucionSeleccionada(institucion); setShowEditModal(true); }}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white p-2 rounded-lg border border-blue-200 transition-all shadow-sm active:scale-95"
                            title="Editar institución" disabled={loading}
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        {canHistory && (
                          <button 
                            onClick={() => { setInstitucionSeleccionada(institucion); setShowHistorialModal(true); }}
                            className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white p-2 rounded-lg border border-purple-200 transition-all shadow-sm active:scale-95"
                            title="Ver historial de períodos" disabled={loading}
                          >
                            <History size={16} />
                          </button>
                        )}
                        {(userRol === 'admin' || userRol === 'contabilidad') && (
                          <button 
                            onClick={() => { setInstitucionSeleccionada(institucion); setShowAuditoriaModal(true); }}
                            className="bg-slate-100 text-slate-700 hover:bg-slate-700 hover:text-white p-2 rounded-lg border border-slate-200 transition-all shadow-sm active:scale-95" 
                            title="Ver Auditoría de Cambios" disabled={loading}
                          >
                            <ClipboardList size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => handleDelete(institucion.id, institucion.nombre)}
                            className="bg-red-50 text-red-700 hover:bg-red-600 hover:text-white p-2 rounded-lg border border-red-200 transition-all shadow-sm active:scale-95"
                            title="Eliminar institución" disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats de consultas */}
                    <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Asignadas</p>
                        <p className="text-xl font-black text-blue-600">{asignadas.toLocaleString()}</p>
                      </div>
                      <div className="border-l border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Consumidas</p>
                        <p className="text-xl font-black text-slate-800">{consumidas.toLocaleString()}</p>
                      </div>
                      <div className="border-l border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Restantes</p>
                        <p className="text-xl font-black text-emerald-600">{restantes.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Barra de progreso de uso */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uso del contrato</span>
                        <span className={`text-xs font-bold ${
                          porcentajeUso >= 90 ? 'text-red-600' : porcentajeUso >= 70 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>{porcentajeUso.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                          style={{ width: `${porcentajeUso}%` }} 
                        />
                      </div>
                    </div>

                    {/* Consumo por mes con Sparkline (Punto 2) */}
                    {institucion.consumoPorMes && Object.keys(institucion.consumoPorMes).length > 0 ? (
                      <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col flex-1">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center">
                          <BarChart2 className="mr-1 text-brand-500" size={14} />
                          Tendencia de Consumo
                        </h4>
                        
                        <div className="h-28 w-full mt-2">
                          <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
                            <AreaChart data={Object.entries(institucion.consumoPorMes).sort(([a], [b]) => a.localeCompare(b)).map(([mes, consumo]) => ({ name: new Date(mes + '-01T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(), consumo, mesRaw: mes }))} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`color-${institucion.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ff5105" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#ff5105" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Tooltip 
                                formatter={(value) => [value.toLocaleString(), 'Consultas']}
                                contentStyle={{ 
                                  borderRadius: '12px', 
                                  background: 'rgba(255, 255, 255, 0.95)', 
                                  backdropFilter: 'blur(10px)',
                                  border: '1px solid rgba(0, 0, 0, 0.08)', 
                                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)', 
                                  fontSize: '12px',
                                  color: '#1e293b'
                                }}
                                itemStyle={{ color: '#ff5105' }}
                                labelStyle={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}
                              />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: '500'}} height={14} dy={5} />
                              <Area type="monotone" dataKey="consumo" stroke="#ff5105" strokeWidth={2} fillOpacity={1} fill={`url(#color-${institucion.id})`} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {(canEdit || canDelete) && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dashed border-slate-100">
                            {Object.entries(institucion.consumoPorMes).sort(([a], [b]) => a.localeCompare(b)).map(([mes, consumo]) => (
                               <div key={mes} className="group/item flex items-center text-xs bg-brand-50 border border-brand-100 rounded px-2 py-1 shadow-sm transition-all hover:border-brand-300">
                                 <span className="font-bold text-brand-850 pr-1.5 border-r border-brand-200 mr-1.5">{new Date(mes + '-01T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</span>
                                 <span className="text-brand-700 font-extrabold mr-1">{consumo.toLocaleString()}</span>
                                 
                                 <div className="flex space-x-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 w-0 overflow-hidden group-hover/item:w-auto group-hover/item:ml-1">
                                    {canEdit && <button onClick={() => { setInstitucionSeleccionada(institucion); setMesSeleccionadoParaEditar(mes); setShowEditConsumoModal(true); }} className="text-slate-500 hover:text-blue-600 bg-white hover:bg-slate-50 rounded p-1 transition-colors" title="Editar"><Edit3 size={11} /></button>}
                                    {canDelete && <button onClick={() => handleEliminarConsumoMensual(institucion, mes)} className="text-slate-500 hover:text-red-655 bg-white hover:bg-slate-50 rounded p-1 transition-colors" title="Eliminar"><Trash2 size={11} /></button>}
                                 </div>
                               </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 pt-6 pb-4 border-t border-slate-100 flex flex-col items-center justify-center flex-1">
                        <div className="bg-slate-50 p-3 rounded-full mb-2">
                          <BarChart2 className="text-slate-400" size={20} />
                        </div>
                        <p className="text-[11px] text-slate-550 font-bold uppercase tracking-wider text-center">Aún sin movimientos</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="mt-8 pt-4 flex justify-between items-center border-t border-slate-200">
            <span className="text-sm font-medium text-slate-500">Mostrando pág {currentPage} de {totalPages}</span>
            <div className="space-x-2">
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 border border-slate-350 bg-white rounded-lg text-slate-655 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-sm">Anterior</button>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-4 py-2 border border-slate-350 bg-white rounded-lg text-slate-655 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-sm">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {showModal && <ModalAgregarInstitucion onClose={() => setShowModal(false)} onSave={handleSave} />}
      {showEditModal && institucionSeleccionada && <ModalEditarInstitucion institucion={institucionSeleccionada} onClose={() => { setShowEditModal(false); setInstitucionSeleccionada(null); }} onSave={handleEdit} />}
      {showConsumoModal && institucionSeleccionada && <ModalConsumoMensual institucion={institucionSeleccionada} onClose={() => { setShowConsumoModal(false); setInstitucionSeleccionada(null); }} onSave={handleConsumoMensual} />}
      {showEditConsumoModal && institucionSeleccionada && mesSeleccionadoParaEditar && <ModalEditarConsumoMes institucion={institucionSeleccionada} mesSeleccionado={mesSeleccionadoParaEditar} onClose={() => { setShowEditConsumoModal(false); setInstitucionSeleccionada(null); setMesSeleccionadoParaEditar(null); }} onSave={handleEditarConsumoMensual} />}
      {showHistorialModal && institucionSeleccionada && <ModalHistorial institucion={institucionSeleccionada} onClose={() => { setShowHistorialModal(false); setInstitucionSeleccionada(null); }} />}
      {showAuditoriaModal && institucionSeleccionada && <ModalAuditoria institucion={institucionSeleccionada} onClose={() => { setShowAuditoriaModal(false); setInstitucionSeleccionada(null); }} />}
    </div>
  );
};

export default Instituciones;