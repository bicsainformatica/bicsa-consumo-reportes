// src/components/DashboardExcel.jsx
import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Database, 
  TrendingUp, 
  Building,
  Calendar,
  BarChart3,
  Loader2,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useInstituciones, useEstadisticas } from '../hooks/useFirebase';

const DashboardExcel = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { instituciones, loading } = useInstituciones();
  const estadisticas = useEstadisticas();

  const generarReporteExcel = async () => {
    // 🔧 FUNCIÓN HELPER DEFINIDA AL PRINCIPIO - ESTO SOLUCIONA EL ERROR
    const formatearFecha = (fecha) => {
      if (!fecha) return 'N/A';
      
      try {
        // Si la fecha ya está en formato dd/mm/yyyy
        if (typeof fecha === 'string' && fecha.includes('/')) {
          return fecha; // Ya está formateada
        }
        
        // Si es un timestamp o fecha ISO
        const fechaObj = new Date(fecha);
        if (isNaN(fechaObj.getTime())) {
          return 'N/A';
        }
        
        return fechaObj.toLocaleDateString('es-ES');
      } catch (error) {
        console.error('Error formateando fecha:', fecha, error);
        return 'N/A';
      }
    };

    try {
      setIsExporting(true);

      // Crear un nuevo workbook
      const workbook = XLSX.utils.book_new();

      // Calcular estadísticas actualizadas
      const institucionesPendientes = instituciones.filter(i => i.estado === 'pendiente').length;
      const institucionesActivas = instituciones.filter(i => i.estado === 'activo' || !i.estado).length;
      const institucionesVencidas = instituciones.filter(i => i.estado === 'vencido').length;
      const totalConsultasAsignadas = instituciones.reduce((total, inst) => total + (inst.contrato?.asignadas || 0), 0);
      const totalConsultasConsumidas = instituciones.reduce((total, inst) => total + (inst.contrato?.consumidas || 0), 0);
      const totalConsultasRestantes = totalConsultasAsignadas - totalConsultasConsumidas;

      // === HOJA 1: DASHBOARD ===
      const dataDashboard = [
        ['REPORTE DE CONSUMO MiPymes - BICSA'],
        [''],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES')],
        ['Hora de Generación:', new Date().toLocaleTimeString('es-ES')],
        [''],
        ['=== ESTADÍSTICAS GENERALES ==='],
        ['Total de Instituciones:', instituciones.length],
        ['Instituciones Activas:', institucionesActivas],
        ['Instituciones Pendientes:', institucionesPendientes],
        ['Instituciones Vencidas (No Renovadas):', institucionesVencidas],
        ['Instituciones con Historial (Renovaciones):', instituciones.filter(i => i.historial && i.historial.length > 0).length],
        [''],
        ['=== CONSUMO DETALLADO POR INSTITUCIÓN ==='],
        ['Institución', 'Estado', 'Consultas Asignadas', 'Consultas Consumidas', 'Consultas Restantes', '% Consumo', 'Fecha Inicio', 'Fecha Vencimiento', 'Duración (meses)', 'Períodos Anteriores']
      ];

      // Agregar datos de cada institución al dashboard
      instituciones.forEach(institucion => {
        const asignadas = institucion.contrato?.asignadas || 0;
        const consumidas = institucion.contrato?.consumidas || 0;
        const restantes = asignadas - consumidas;
        const porcentajeUso = asignadas > 0 ? ((consumidas / asignadas) * 100).toFixed(1) : 0;
        const periodosAnteriores = institucion.historial ? institucion.historial.length : 0;
        
        dataDashboard.push([
          institucion.nombre,
          institucion.estado || 'activo',
          asignadas,
          consumidas,
          restantes,
          `${porcentajeUso}%`,
          institucion.contrato?.fechaInicio || institucion.fechaCreacion,
          institucion.contrato?.fechaFin || 'N/A',
          institucion.contrato?.duracionMeses || 0,
          periodosAnteriores
        ]);
      });

      // Agregar sección de consumo mensual detallado
      dataDashboard.push(['']);
      dataDashboard.push(['=== CONSUMO MENSUAL DETALLADO ===']);
      dataDashboard.push(['Institución', 'Mes', 'Consumo Registrado', 'Estado Institución']);

      // Agregar consumo mensual de cada institución
      instituciones.forEach(institucion => {
        if (institucion.consumoPorMes && Object.keys(institucion.consumoPorMes).length > 0) {
          Object.entries(institucion.consumoPorMes)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([mes, consumo]) => {
              dataDashboard.push([
                institucion.nombre, 
                mes, 
                consumo, 
                institucion.estado || 'activo'
              ]);
            });
        }
      });

      // Crear hoja Dashboard
      const worksheetDashboard = XLSX.utils.aoa_to_sheet(dataDashboard);
      
      // Aplicar estilos a la hoja Dashboard
      const colWidths = [
        { wch: 30 }, // Institución
        { wch: 15 }, // Estado
        { wch: 20 }, // Consultas Asignadas
        { wch: 20 }, // Consultas Consumidas
        { wch: 20 }, // Consultas Restantes
        { wch: 12 }, // % Consumo
        { wch: 15 }, // Fecha Inicio
        { wch: 15 }, // Fecha Vencimiento
        { wch: 15 }, // Duración
        { wch: 18 }  // Períodos Anteriores
      ];
      worksheetDashboard['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheetDashboard, 'Dashboard');

      // === HOJA 2: INSTITUCIONES DETALLADAS ===
      const dataInstituciones = [
        ['DETALLE COMPLETO DE INSTITUCIONES'],
        [''],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES')],
        [''],
        ['ID', 'Nombre', 'Estado', 'Fecha Creación', 'Fecha Inicio Contrato', 'Fecha Vencimiento', 'Duración (meses)', 'Consultas Asignadas', 'Consultas Consumidas', 'Consultas Restantes', '% Consumo', 'Períodos Anteriores', 'Meses Registrados']
      ];

      // Agregar datos detallados de cada institución
      instituciones.forEach((institucion, index) => {
        const asignadas = institucion.contrato?.asignadas || 0;
        const consumidas = institucion.contrato?.consumidas || 0;
        const restantes = asignadas - consumidas;
        const porcentajeUso = asignadas > 0 ? ((consumidas / asignadas) * 100).toFixed(1) : 0;
        const periodosAnteriores = institucion.historial ? institucion.historial.length : 0;
        const mesesRegistrados = institucion.consumoPorMes ? Object.keys(institucion.consumoPorMes).length : 0;

        dataInstituciones.push([
          index + 1,
          institucion.nombre,
          institucion.estado || 'activo',
          institucion.fechaCreacion,
          institucion.contrato?.fechaInicio || 'N/A',
          institucion.contrato?.fechaFin || 'N/A',
          institucion.contrato?.duracionMeses || 0,
          asignadas,
          consumidas,
          restantes,
          `${porcentajeUso}%`,
          periodosAnteriores,
          mesesRegistrados
        ]);
      });

      // Sección de historial detallado
      dataInstituciones.push(['']);
      dataInstituciones.push(['=== HISTORIAL DE RENOVACIONES ===']);
      dataInstituciones.push(['Institución', 'Período #', 'Inicio Período', 'Fin Período', 'Duración (meses)', 'Consultas Asignadas', 'Consultas Consumidas', 'Consultas Restantes', '% Consumo', 'Fecha Renovación', 'Renovado Por', 'Comentario']);

      // Agregar historial de cada institución CON FUNCIÓN CORREGIDA
      instituciones.forEach(institucion => {
        if (institucion.historial && institucion.historial.length > 0) {
          const historialOrdenado = [...institucion.historial].reverse();
          
          historialOrdenado.forEach((periodo, index) => {
            const numeroPeriodo = index + 1;
            const asignadasPeriodo = periodo.consultasAsignadas || 0;
            const consumidasPeriodo = periodo.consultasConsumidas || 0;
            const restantesPeriodo = asignadasPeriodo - consumidasPeriodo;
            const porcentajePeriodo = asignadasPeriodo > 0 ? ((consumidasPeriodo / asignadasPeriodo) * 100).toFixed(1) : 0;
            
            // 🔧 USAR LA FUNCIÓN CORRECTAMENTE DEFINIDA
            dataInstituciones.push([
              institucion.nombre,
              numeroPeriodo,
              formatearFecha(periodo.periodoInicio), // ✅ CORREGIDO
              formatearFecha(periodo.periodoFin), // ✅ CORREGIDO - AQUÍ ESTABA EL PROBLEMA
              periodo.duracionMeses || 0,
              asignadasPeriodo,
              consumidasPeriodo,
              restantesPeriodo,
              `${porcentajePeriodo}%`,
              formatearFecha(periodo.fechaRenovacion), // ✅ CORREGIDO
              periodo.renovadoPor || 'N/A',
              periodo.comentario || 'Sin comentarios'
            ]);
          });
        }
      });

      // Crear hoja Instituciones
      const worksheetInstituciones = XLSX.utils.aoa_to_sheet(dataInstituciones);
      
      const colWidthsInst = [
        { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, 
        { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, 
        { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
      ];
      worksheetInstituciones['!cols'] = colWidthsInst;

      XLSX.utils.book_append_sheet(workbook, worksheetInstituciones, 'Instituciones');

      // === HOJA 3: CONSUMO MENSUAL ===
      const dataConsumoMensual = [
        ['CONSUMO MENSUAL DETALLADO POR INSTITUCIÓN'],
        [''],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES')],
        [''],
        ['Institución', 'Mes/Año', 'Consumo Registrado', 'Estado Institución', '% del Total Asignado']
      ];

      const consumosPorMes = [];
      instituciones.forEach(institucion => {
        if (institucion.consumoPorMes && Object.keys(institucion.consumoPorMes).length > 0) {
          Object.entries(institucion.consumoPorMes)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([mes, consumo]) => {
              const totalAsignadas = institucion.contrato?.asignadas || 0;
              const porcentajeDelTotal = totalAsignadas > 0 ? ((consumo / totalAsignadas) * 100).toFixed(2) : 0;
              
              consumosPorMes.push([
                institucion.nombre,
                mes,
                consumo,
                institucion.estado || 'activo',
                `${porcentajeDelTotal}%`
              ]);
            });
        }
      });

      consumosPorMes.sort((a, b) => a[1].localeCompare(b[1]));
      dataConsumoMensual.push(...consumosPorMes);

      const worksheetConsumo = XLSX.utils.aoa_to_sheet(dataConsumoMensual);
      worksheetConsumo['!cols'] = [
        { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheetConsumo, 'Consumo Mensual');

      // === HOJA 4: ANÁLISIS ESTADÍSTICO ===
      const dataAnalisis = [
        ['ANÁLISIS ESTADÍSTICO DEL SISTEMA'],
        [''],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES')],
        [''],
        ['=== MÉTRICAS GENERALES ==='],
        ['Total de Instituciones:', instituciones.length],
        ['Instituciones con Historial:', instituciones.filter(i => i.historial && i.historial.length > 0).length],
        ['Total de Renovaciones Registradas:', instituciones.reduce((total, inst) => total + (inst.historial ? inst.historial.length : 0), 0)],
        ['Promedio de Renovaciones por Institución:', instituciones.length > 0 ? (instituciones.reduce((total, inst) => total + (inst.historial ? inst.historial.length : 0), 0) / instituciones.length).toFixed(2) : 0],
        [''],
        ['=== ANÁLISIS DE CONSUMO ==='],
        ['Institución', 'Consultas Asignadas', 'Consultas Consumidas', 'Consultas Restantes', '% Uso', 'Eficiencia', 'Períodos Históricos', 'Promedio Consumo/Mes']
      ];

      instituciones.forEach(institucion => {
        const asignadas = institucion.contrato?.asignadas || 0;
        const consumidas = institucion.contrato?.consumidas || 0;
        const restantes = asignadas - consumidas;
        const porcentajeUso = asignadas > 0 ? ((consumidas / asignadas) * 100).toFixed(1) : 0;
        const duracionMeses = institucion.contrato?.duracionMeses || 1;
        const promedioConsumoMes = duracionMeses > 0 ? Math.round(consumidas / duracionMeses) : 0;
        const periodosHistoricos = institucion.historial ? institucion.historial.length : 0;
        
        let eficiencia = 'N/A';
        if (asignadas > 0) {
          const uso = (consumidas / asignadas) * 100;
          if (uso < 50) eficiencia = 'Bajo Uso';
          else if (uso < 80) eficiencia = 'Uso Normal';
          else if (uso < 95) eficiencia = 'Uso Óptimo';
          else eficiencia = 'Uso Crítico';
        }

        dataAnalisis.push([
          institucion.nombre,
          asignadas,
          consumidas,
          restantes,
          `${porcentajeUso}%`,
          eficiencia,
          periodosHistoricos,
          promedioConsumoMes
        ]);
      });

      const worksheetAnalisis = XLSX.utils.aoa_to_sheet(dataAnalisis);
      worksheetAnalisis['!cols'] = [
        { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, 
        { wch: 15 }, { wch: 18 }, { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheetAnalisis, 'Análisis Estadístico');

      // Generar nombre del archivo
      const fechaHora = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const nombreArchivo = `SegConsumo_Reporte_Usuario_${fechaHora}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(workbook, nombreArchivo);

      // Mensaje de éxito
      alert(`¡Reporte Excel generado exitosamente!\n\nArchivo: ${nombreArchivo}\n\nIncluye:\n- Dashboard: Estadísticas generales\n- Instituciones: Datos detallados e historial\n- Consumo Mensual: Registro completo\n- Análisis Estadístico: Métricas avanzadas\n\n🔧 CORREGIDO: Ya no aparece "Invalid Date" ni errores de inicialización`);

    } catch (error) {
      console.error('Error al generar reporte Excel:', error);
      alert(`Error al generar el reporte: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Calcular estadísticas locales
  const institucionesPendientes = instituciones.filter(i => i.estado === 'pendiente').length;
  const totalConsultasConsumidas = instituciones.reduce((total, inst) => total + (inst.contrato?.consumidas || 0), 0);

  if (loading) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Cargando datos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <FileSpreadsheet size={48} className="text-green-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Exportar Reporte Excel Completo</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Genera un reporte completo en formato Excel con todas las estadísticas, datos de instituciones, consumo mensual, historial y análisis estadístico del sistema SegConsumo.
        </p>

        {/* Información del reporte actualizada */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-center mb-3">
              <BarChart3 className="text-blue-600" size={32} />
            </div>
            <h3 className="font-semibold text-blue-800 mb-2">Hoja Dashboard</h3>
            <p className="text-blue-600 text-sm">
              Estadísticas generales, resumen por estado y consumo detallado actualizado
            </p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-center mb-3">
              <Building className="text-purple-600" size={32} />
            </div>
            <h3 className="font-semibold text-purple-800 mb-2">Hoja Instituciones</h3>
            <p className="text-purple-600 text-sm">
              Datos completos, historial de renovaciones con numeración cronológica correcta
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center justify-center mb-3">
              <Calendar className="text-green-600" size={32} />
            </div>
            <h3 className="font-semibold text-green-800 mb-2">Hoja Consumo Mensual</h3>
            <p className="text-green-600 text-sm">
              Registro detallado con porcentajes actualizados del consumo mensual
            </p>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center justify-center mb-3">
              <TrendingUp className="text-orange-600" size={32} />
            </div>
            <h3 className="font-semibold text-orange-800 mb-2">Hoja Análisis</h3>
            <p className="text-orange-600 text-sm">
              Métricas avanzadas, eficiencia y análisis estadístico del sistema
            </p>
          </div>
        </div>

        {/* Estadísticas rápidas actualizadas */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Datos Actualizados a Exportar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{instituciones.length}</div>
              <div className="text-sm text-gray-600">Instituciones</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{institucionesPendientes}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {instituciones.filter(i => i.historial && i.historial.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">Con Historial</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {instituciones.reduce((total, inst) => total + (inst.historial ? inst.historial.length : 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Renovaciones</div>
            </div>
          </div>
        </div>

        {/* Botón de exportación */}
        <button
          onClick={generarReporteExcel}
          disabled={isExporting || instituciones.length === 0}
          className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold flex items-center mx-auto hover:bg-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 size={24} className="mr-3 animate-spin" />
              Generando Reporte Completo...
            </>
          ) : (
            <>
              <Download size={24} className="mr-3" />
              Exportar Reporte Completo a Excel
            </>
          )}
        </button>

        {instituciones.length === 0 && (
          <p className="text-red-500 text-sm mt-4">
            No hay datos para exportar. Primero registra algunas instituciones.
          </p>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p>El archivo se descargará automáticamente en formato .xlsx</p>
          <p>Compatible con Microsoft Excel, Google Sheets y LibreOffice Calc</p>
          <p className="text-green-600 font-medium mt-2">Incluye nueva hoja de Análisis Estadístico con métricas avanzadas</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardExcel;