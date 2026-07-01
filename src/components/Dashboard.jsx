// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { BarChart2, TrendingUp, AlertCircle, Loader2, RefreshCw, Building, Search, X, Clock } from 'lucide-react';
import { useInstituciones } from '../hooks/useFirebase';
import * as XLSX from 'xlsx';

// Componente para la barra de progreso (Renovado para modo claro)
const ProgressBar = ({ value, max }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  let colorClass = 'bg-brand-500'; // Color base corporativo
  if (percentage > 70) colorClass = 'bg-amber-500'; // Advertencia
  if (percentage > 90) colorClass = 'bg-red-500 danger-pulse';   // Peligro

  return (
    <div className="w-full bg-slate-200 rounded-full h-3 border border-slate-300/30 shadow-inner overflow-hidden">
      <div 
        className={`${colorClass} h-full rounded-full transition-all duration-700 ease-out shadow-sm`} 
        style={{ width: `${Math.min(percentage, 100)}%` }}
      ></div>
    </div>
  );
};

const Dashboard = ({ onExportExcel }) => {
  const { instituciones, loading, error } = useInstituciones();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // 🆕 ESTADOS PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 🆕 RESETEAR PÁGINA A 1 SI EL USUARIO BUSCA ALGO
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- LÓGICA DE EXPORTACIÓN INTACTA ---
  const generarReporteExcel = async () => {
    try {
      setIsExporting(true);
      const workbook = XLSX.utils.book_new();

      const institucionesPendientes = instituciones.filter(i => i.estado === 'pendiente').length;
      const institucionesActivas = instituciones.filter(i => i.estado === 'activo' || !i.estado).length;
      const institucionesVencidas = instituciones.filter(i => i.estado === 'vencido').length;
      const totalConsultasAsignadas = instituciones.reduce((total, inst) => total + (inst.contrato?.asignadas || 0), 0);
      const totalConsultasConsumidas = instituciones.reduce((total, inst) => total + (inst.contrato?.consumidas || 0), 0);
      const totalConsultasRestantes = totalConsultasAsignadas - totalConsultasConsumidas;

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
        ['Instituciones Vencidas:', institucionesVencidas],
        ['Total Consultas Asignadas:', totalConsultasAsignadas],
        ['Total Consultas Consumidas:', totalConsultasConsumidas],
        ['Total Consultas Restantes:', totalConsultasRestantes],
        ['Promedio de Uso General (%):', totalConsultasAsignadas > 0 ? `${((totalConsultasConsumidas / totalConsultasAsignadas) * 100).toFixed(1)}%` : '0%'],
        [''],
        ['=== RESUMEN POR ESTADO ==='],
        ['Instituciones Activas:', institucionesActivas],
        ['Instituciones Pendientes:', institucionesPendientes],
        ['Instituciones Vencidas (No Renovadas):', institucionesVencidas],
        ['Instituciones con Historial (Renovaciones):', instituciones.filter(i => i.historial && i.historial.length > 0).length],
        [''],
        ['=== CONSUMO DETALLADO POR INSTITUCIÓN ==='],
        ['Institución', 'Estado', 'Consultas Asignadas', 'Consultas Consumidas', 'Consultas Restantes', '% Consumo', 'Fecha Inicio', 'Fecha Vencimiento', 'Duración (meses)', 'Períodos Anteriores']
      ];

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

      dataDashboard.push(['']);
      dataDashboard.push(['=== CONSUMO MENSUAL DETALLADO ===']);
      dataDashboard.push(['Institución', 'Mes', 'Consumo Registrado', 'Estado Institución']);

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

      const worksheetDashboard = XLSX.utils.aoa_to_sheet(dataDashboard);
      
      const colWidths = [
        { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, 
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
      ];
      worksheetDashboard['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(workbook, worksheetDashboard, 'Dashboard');

      const dataInstituciones = [
        ['DETALLE COMPLETO DE INSTITUCIONES'],
        [''],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES')],
        [''],
        ['ID', 'Nombre', 'Estado', 'Fecha Creación', 'Fecha Inicio Contrato', 'Fecha Vencimiento', 'Duración (meses)', 'Consultas Asignadas', 'Consultas Consumidas', 'Consultas Restantes', '% Consumo', 'Períodos Anteriores', 'Meses Registrados']
      ];

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

      dataInstituciones.push(['']);
      dataInstituciones.push(['=== HISTORIAL DE RENOVACIONES ===']);
      dataInstituciones.push(['Institución', 'Período #', 'Inicio Período', 'Fin Período', 'Duración (meses)', 'Consultas Asignadas', 'Consultas Consumidas', 'Consultas Restantes', '% Consumo', 'Fecha Renovación', 'Renovado Por', 'Comentario']);

      instituciones.forEach(institucion => {
        if (institucion.historial && institucion.historial.length > 0) {
          const historialOrdenado = [...institucion.historial].reverse();
          
          historialOrdenado.forEach((periodo, index) => {
            const numeroPeriodo = index + 1;
            const asignadasPeriodo = periodo.consultasAsignadas || 0;
            const consumidasPeriodo = periodo.consultasConsumidas || 0;
            const restantesPeriodo = asignadasPeriodo - consumidasPeriodo;
            const porcentajePeriodo = asignadasPeriodo > 0 ? ((consumidasPeriodo / asignadasPeriodo) * 100).toFixed(1) : 0;
            
            dataInstituciones.push([
              institucion.nombre,
              numeroPeriodo,
              new Date(periodo.periodoInicio).toLocaleDateString('es-ES'),
              new Date(periodo.periodoFin).toLocaleDateString('es-ES'),
              periodo.duracionMeses || 0,
              asignadasPeriodo,
              consumidasPeriodo,
              restantesPeriodo,
              `${porcentajePeriodo}%`,
              new Date(periodo.fechaRenovacion).toLocaleDateString('es-ES'),
              periodo.renovadoPor || 'N/A',
              periodo.comentario || 'Sin comentarios'
            ]);
          });
        }
      });

      const worksheetInstituciones = XLSX.utils.aoa_to_sheet(dataInstituciones);
      const colWidthsInst = [
        { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, 
        { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, 
        { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
      ];
      worksheetInstituciones['!cols'] = colWidthsInst;
      XLSX.utils.book_append_sheet(workbook, worksheetInstituciones, 'Instituciones');

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

      const fechaHora = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const nombreArchivo = `SegConsumo_Reporte_Usuario_${fechaHora}.xlsx`;

      XLSX.writeFile(workbook, nombreArchivo);

      alert(`¡Reporte Excel generado exitosamente!\n\nArchivo: ${nombreArchivo}\n\nIncluye:\n- Dashboard: Estadísticas generales\n- Instituciones: Datos detallados e historial\n- Consumo Mensual: Registro completo\n- Análisis Estadístico: Métricas avanzadas`);

    } catch (error) {
      console.error('Error al generar reporte Excel:', error);
      alert(`Error al generar el reporte: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };
  // ---------------------------------------------

  React.useEffect(() => {
    if (onExportExcel && window.location.pathname === '/dashboard') {
      onExportExcel(generarReporteExcel);
    }
  }, [onExportExcel]); 

  const institucionesFiltradas = instituciones.filter((institucion) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const nombreCoincide = institucion.nombre.toLowerCase().includes(searchLower);
    return nombreCoincide;
  });

  // 🆕 LÓGICA DE PAGINACIÓN: Extraer solo los ítems de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = institucionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(institucionesFiltradas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const obtenerNotificaciones = () => {
    const notificaciones = [];
    
    instituciones.forEach(institucion => {
      if (institucion.contrato?.fechaFin && (institucion.estado === 'activo' || !institucion.estado)) {
        const hoy = new Date();
        let vencimiento;
        
        if (institucion.contrato.fechaFin.includes('/')) {
          const partes = institucion.contrato.fechaFin.split('/');
          vencimiento = new Date(`${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`);
        } else {
          vencimiento = new Date(institucion.contrato.fechaFin);
        }

        if (!isNaN(vencimiento.getTime())) {
          const calcularMesesHastaVencimiento = (fechaActual, fechaVencimiento) => {
            const añoActual = fechaActual.getFullYear();
            const mesActual = fechaActual.getMonth();
            const diaActual = fechaActual.getDate();
            
            const añoVencimiento = fechaVencimiento.getFullYear();
            const mesVencimiento = fechaVencimiento.getMonth();
            const diaVencimiento = fechaVencimiento.getDate();
            
            let mesesDiferencia = (añoVencimiento - añoActual) * 12 + (mesVencimiento - mesActual);
            
            if (diaVencimiento < diaActual) {
              mesesDiferencia--;
            }
            
            return Math.max(0, mesesDiferencia);
          };
          
          const diffMonths = calcularMesesHastaVencimiento(hoy, vencimiento);
          
          if (diffMonths >= 0 && diffMonths <= 2) {
            const diffTime = vencimiento.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            notificaciones.push({
              nombre: institucion.nombre,
              fecha: institucion.contrato.fechaFin,
              meses: diffMonths,
              dias: diffDays,
              tipo: diffMonths <= 1 ? 'critico' : 'advertencia'
            });
          }
        }
      }
    });
    
    return notificaciones.sort((a, b) => a.meses - b.meses);
  };

  const notificaciones = obtenerNotificaciones();

  // Mostrar loading
  if (loading && instituciones.length === 0) {
    return (
      <div className="bg-slate-50 p-6 sm:p-10 min-h-screen flex items-center justify-center relative overflow-hidden grid-overlay">
        <div className="text-center relative z-10">
          <Loader2 size={48} className="animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium tracking-wide">Cargando datos desde Firebase...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-slate-50 p-6 sm:p-10 min-h-screen flex items-center justify-center relative overflow-hidden grid-overlay">
        <div className="text-center bg-white p-8 rounded-2xl border border-slate-200 max-w-md shadow-lg relative z-10 backdrop-blur-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-800 font-bold mb-2 text-lg">Error de conexión</p>
          <p className="text-slate-655 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 flex items-center space-x-2 mx-auto font-bold transition-all active:scale-95 shadow-lg shadow-red-600/10"
          >
            <RefreshCw size={18} />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 p-4 sm:p-8 min-h-screen relative overflow-hidden grid-overlay">
      
      {/* Background Glow Spots */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full blur-[150px] glow-spot-orange pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-[150px] glow-spot-purple pointer-events-none"></div>

      {/* Indicador de exportación */}
      {isExporting && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-brand-600 to-amber-500 text-white p-3 text-center shadow-lg border-b border-brand-500/20 backdrop-blur-md">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 size={20} className="animate-spin" />
            <span className="font-bold tracking-wide">Generando reporte Excel corporativo...</span>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="mb-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 flex items-center tracking-tight">
              <BarChart2 size={32} className="mr-3 text-brand-500" />
              Dashboard de Consumo
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Monitoreo de Instituciones y Contratos
              {loading && <span className="text-brand-500 ml-2 animate-pulse text-sm">🔄 Sincronizando...</span>}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 shadow-sm">
            Actualizado: <span className="text-slate-800">{new Date().toLocaleString('es-ES')}</span>
          </div>
        </div>
      </header>

      {/* Notificaciones de Vencimiento */}
      {notificaciones.length > 0 && (
        <div className="mb-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {notificaciones.map((notif, index) => (
            <div
              key={index}
              className={`p-5 rounded-2xl border-l-4 flex items-start space-x-4 shadow-md border ${
                notif.tipo === 'critico'
                  ? 'bg-red-50 border-red-200 text-red-800 border-red-500'
                  : 'bg-amber-50 border-amber-200 text-amber-800 border-amber-500'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {notif.tipo === 'critico' ? (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <Clock className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-base">
                    {notif.tipo === 'critico' ? '¡Contrato crítico!' : 'Atención: Vencimiento próximo'}
                  </p>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    notif.tipo === 'critico' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {notif.meses === 0 ? `${notif.dias} días restantes` : 
                    notif.meses === 1 ? '1 mes restante' : 
                    `${notif.meses} meses restantes`}
                  </span>
                </div>
                <p className="text-sm">
                  <strong className="text-slate-900">{notif.nombre}</strong> - Vence: <strong>{notif.fecha}</strong>
                  {notif.tipo === 'critico' && (
                    <span className="block mt-2 text-red-800 font-semibold bg-red-100/50 border border-red-200/50 p-2 rounded-lg text-xs">
                      ⚠️ Sugerimos contactar urgentemente para renovación.
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Buscador */}
      {instituciones.length > 0 && (
        <div className="mb-8 flex justify-center relative z-10">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar instituciones por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white shadow-sm font-medium text-slate-700 placeholder-slate-400 transition-all outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de instituciones */}
      <div className="space-y-8 relative z-10">
        {instituciones.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-md">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building size={40} className="text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-800 mb-2">No hay instituciones registradas</p>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Aún no se ha cargado información. Las instituciones aparecerán aquí una vez que sean creadas en el sistema.
            </p>
            <div className="inline-flex items-center bg-brand-50 px-4 py-2 rounded-lg border border-brand-100">
              <p className="text-brand-850 text-sm font-medium flex items-center">
                <RefreshCw size={16} className="mr-2 text-brand-500" />
                Sincronización automática activa
              </p>
            </div>
          </div>
        ) : (
          <>
            {searchTerm && (
              <div className="text-center mb-6">
                <span className="inline-block bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-brand-100">
                  Mostrando {institucionesFiltradas.length} de {instituciones.length} resultados
                </span>
              </div>
            )}

            {/* 🆕 ACA MAPEA SOLO LAS INSTITUCIONES DE LA PÁGINA ACTUAL */}
            {currentItems.map((inst) => {
              const { nombre, contrato } = inst;
              const asignadas = contrato?.asignadas || 0;
              const consumidas = contrato?.consumidas || 0;
              const restantes = asignadas - consumidas;
              const porcentajeUso = asignadas > 0 ? (consumidas / asignadas) * 100 : 0;

              // Determinar colores de estado visual
              let estadoTexto = 'Saludable';
              let estadoColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              let iconoEstado = <TrendingUp className="text-emerald-600" size={20} />;
              let estadoCardBg = 'bg-emerald-50/60 border-emerald-100/80';
              let estadoCardText = 'text-emerald-850';
              
              if (porcentajeUso > 90) {
                estadoTexto = 'Crítico';
                estadoColor = 'bg-red-100 text-red-800 border-red-200';
                iconoEstado = <AlertCircle className="text-red-655" size={20} />;
                estadoCardBg = 'bg-red-50/60 border-red-100/80';
                estadoCardText = 'text-red-850';
              } else if (porcentajeUso > 70) {
                estadoTexto = 'Atención';
                estadoColor = 'bg-amber-100 text-amber-800 border-amber-200';
                iconoEstado = <AlertCircle className="text-amber-600" size={20} />;
                estadoCardBg = 'bg-amber-50/60 border-amber-100/80';
                estadoCardText = 'text-amber-850';
              }

              return (
                <div key={inst.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-200 hover:border-brand-500/30 transition-all duration-300 relative overflow-hidden group">
                  
                  {/* Header de la Institución */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-slate-100">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-800 flex items-center tracking-tight">
                        {nombre}
                        {porcentajeUso > 90 && (
                          <AlertCircle className="ml-3 text-red-500 animate-pulse" size={24} title="Consultas críticas" />
                        )}
                      </h2>
                      <div className="flex flex-wrap items-center mt-2 text-sm text-slate-500 font-medium">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 mr-3">
                          Vence: {contrato?.fechaFin || 'N/A'}
                        </span>
                        {inst.contrato?.duracionMeses && (
                          <span className="flex items-center text-slate-400">
                            • <Clock size={14} className="mx-1" /> {inst.contrato.duracionMeses} meses
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${estadoColor}`}>
                        <span className="mr-2">{iconoEstado}</span>
                        {estadoTexto}
                      </span>
                    </div>
                  </div>

                  {/* 4 Tarjetas de Estadísticas Principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    
                    {/* Disponibles (Verde/Seguro) */}
                    <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100/80 hover:bg-emerald-50 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Disponibles</p>
                          <p className="text-3xl font-black text-emerald-800 leading-none">{restantes.toLocaleString()}</p>
                          <p className="text-xs text-emerald-500/80 font-medium mt-1.5">de {asignadas.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <TrendingUp size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Consumo (Naranja) */}
                    <div className="bg-brand-50/60 p-5 rounded-xl border border-brand-100/80 hover:bg-brand-50 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-brand-600 font-bold uppercase tracking-wider mb-1">Consumo</p>
                          <p className="text-3xl font-black text-brand-800 leading-none">{porcentajeUso.toFixed(1)}%</p>
                          <p className="text-xs text-brand-500/80 font-medium mt-1.5">{consumidas.toLocaleString()} usadas</p>
                        </div>
                        <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-black">{Math.round(porcentajeUso)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Asignadas (Gris) */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Asignadas</p>
                          <p className="text-3xl font-black text-slate-800 leading-none">{asignadas.toLocaleString()}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1.5">consultas totales</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-200 text-slate-655 rounded-full flex items-center justify-center">
                          <BarChart2 size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Estado de Uso (Dinámico) */}
                    <div className={`${estadoCardBg} p-5 rounded-xl border hover:opacity-90 transition-all duration-200`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${estadoColor.split(' ')[1]}`}>Estado</p>
                          <p className={`text-2xl font-black leading-tight ${estadoCardText}`}>{estadoTexto}</p>
                          <p className={`text-xs font-medium mt-1.5 opacity-80 ${estadoColor.split(' ')[1]}`}>
                            {restantes.toLocaleString()} restantes
                          </p>
                        </div>
                        <div className={`p-2.5 rounded-full bg-white/60 shadow-sm border border-slate-200`}>
                          {iconoEstado}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Progreso del Plan
                      </span>
                      <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded shadow-sm border border-slate-200">
                        {porcentajeUso.toFixed(1)}% consumido
                      </span>
                    </div>
                    <ProgressBar value={consumidas} max={asignadas} />
                  </div>

                  {/* GRILLA DE CONSUMO MENSUAL (REDISEÑADA LIGHT) */}
                  {inst.consumoPorMes && Object.keys(inst.consumoPorMes).length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center">
                        <BarChart2 className="mr-2 text-brand-500" size={18} />
                        Historial Mensual
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {Object.entries(inst.consumoPorMes)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([mes, consumo]) => (
                          <div 
                            key={mes} 
                            className="bg-gradient-to-br from-white to-brand-50/20 p-4 rounded-xl border border-brand-100 shadow-sm hover:border-brand-500/20 hover:bg-white transition-all duration-200 cursor-default"
                          >
                            <div className="text-[10px] font-bold text-brand-850 mb-1 uppercase tracking-widest opacity-80">
                              {new Date(mes + '-01T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                            </div>
                            
                            <div className="text-3xl font-black text-brand-600 drop-shadow-sm leading-none my-2">
                              {consumo.toLocaleString()}
                            </div>
                            
                            <div className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">
                              Consultas
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}

            {/* 🆕 COMPONENTE UI DE PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="text-sm text-slate-500 font-medium">
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, institucionesFiltradas.length)} de {institucionesFiltradas.length} instituciones
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-350 bg-white rounded-lg text-slate-655 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-sm"
                  >
                    Anterior
                  </button>
                  
                  <div className="hidden sm:flex space-x-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => paginate(i + 1)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all text-sm shadow-sm ${
                          currentPage === i + 1 
                            ? 'bg-brand-500 text-white shadow-lg border border-brand-500' 
                            : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-350 bg-white rounded-lg text-slate-655 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-sm"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {/* Info Footer */}
            <div className="mt-8 bg-brand-50 p-5 rounded-xl border border-brand-100/80 flex items-start shadow-sm">
              <div className="bg-brand-100 p-2 rounded-lg mr-4">
                <BarChart2 className="text-brand-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-brand-850 font-medium">
                  <strong>Versión V3:</strong> Los datos se actualizan de acuerdo a los datos de la intranet BICSA.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;