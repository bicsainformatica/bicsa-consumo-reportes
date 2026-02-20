// src/hooks/useFirebase.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  getDoc,
  where
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../firebase';

// Hook para manejar instituciones
export const useInstituciones = () => {
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para calcular fecha de vencimiento
  const calcularFechaVencimiento = (fechaInicioOrDuracion, duracionMeses = null) => {
    try {
      let fechaInicio, duracion;
      
      if (duracionMeses === null) {
        fechaInicio = new Date();
        duracion = parseInt(fechaInicioOrDuracion);
      } else {
        fechaInicio = new Date(fechaInicioOrDuracion);
        duracion = parseInt(duracionMeses);
      }
      
      if (isNaN(fechaInicio.getTime())) {
        console.error('Fecha de inicio inválida:', fechaInicioOrDuracion);
        return new Date().toISOString().split('T')[0];
      }
      
      if (isNaN(duracion) || duracion <= 0) {
        console.error('Duración inválida:', duracion);
        return new Date().toISOString().split('T')[0];
      }
      
      const fechaVencimiento = new Date(fechaInicio);
      fechaVencimiento.setMonth(fechaInicio.getMonth() + duracion);
      
      return fechaVencimiento.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculando fecha vencimiento:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // Cargar instituciones en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'instituciones'), orderBy('fechaCreacion', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const institucionesData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          institucionesData.push({
            id: doc.id,
            ...data,
            fechaCreacion: data.fechaCreacion?.toDate?.()?.toLocaleDateString('es-ES') || new Date().toLocaleDateString('es-ES'),
            contrato: {
              ...data.contrato,
              fechaFin: data.contrato?.fechaFin ? new Date(data.contrato.fechaFin).toLocaleDateString('es-ES') : 'N/A'
            }
          });
        });
        setInstituciones(institucionesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar instituciones:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Agregar nueva institución
  const agregarInstitucion = async (nuevaInstitucion) => {
    try {
      setLoading(true);
      
      const fechaInicio = nuevaInstitucion.fechaInicio || new Date().toISOString().split('T')[0];
      
      const institucionCompleta = {
        nombre: nuevaInstitucion.nombre,
        estado: 'activo',
        contrato: {
          asignadas: nuevaInstitucion.consultas,
          consumidas: 0,
          fechaInicio: fechaInicio,
          fechaFin: calcularFechaVencimiento(fechaInicio, nuevaInstitucion.duracion),
          duracionMeses: nuevaInstitucion.duracion
        },
        fechaCreacion: serverTimestamp(),
        activa: true,
        consumoPorMes: {},
        historial: []
      };

      const docRef = await addDoc(collection(db, 'instituciones'), institucionCompleta);
      console.log("Institución agregada con ID: ", docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error al agregar institución:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Editar institución con estados y renovación
  const editarInstitucion = async (id, datosActualizados) => {
    try {
      const institucionActual = instituciones.find(inst => inst.id === id);
      if (!institucionActual) {
        return { success: false, error: 'Institución no encontrada' };
      }

      const institucionRef = doc(db, 'instituciones', id);
      
      if (datosActualizados.estado === 'renovacion' && datosActualizados.nuevaFechaInicio) {
        // ✨ CREAR HISTORIAL CON COMENTARIO
        const historialPeriodo = {
          periodoInicio: institucionActual.contrato?.fechaInicio || institucionActual.fechaCreacion,
          periodoFin: institucionActual.contrato?.fechaFin,
          consultasAsignadas: institucionActual.contrato?.asignadas,
          consultasConsumidas: institucionActual.contrato?.consumidas,
          consumoPorMes: institucionActual.consumoPorMes || {},
          duracionMeses: institucionActual.contrato?.duracionMeses,
          fechaRenovacion: new Date().toISOString(),
          // ✨ AGREGAR COMENTARIO AL HISTORIAL
          comentario: datosActualizados.comentarioRenovacion || null,
          renovadoPor: auth.currentUser?.email || 'Sistema'
        };

        await updateDoc(institucionRef, {
          nombre: datosActualizados.nombre,
          estado: 'activo',
          'contrato.asignadas': datosActualizados.consultas,
          'contrato.consumidas': 0,
          'contrato.duracionMeses': datosActualizados.duracion,
          'contrato.fechaInicio': datosActualizados.nuevaFechaInicio,
          'contrato.fechaFin': calcularFechaVencimiento(datosActualizados.nuevaFechaInicio, datosActualizados.duracion),
          consumoPorMes: {},
          historial: [...(institucionActual.historial || []), historialPeriodo],
          // ✨ GUARDAR ÚLTIMO COMENTARIO DE RENOVACIÓN
          ultimaRenovacion: {
            fecha: new Date().toISOString(),
            comentario: datosActualizados.comentarioRenovacion || null,
            renovadoPor: auth.currentUser?.email || 'Sistema'
          }
        });

        console.log("✅ Institución renovada con comentario:", datosActualizados.comentarioRenovacion);
      } else {
        const fechaInicioOriginal = institucionActual.contrato?.fechaInicio || new Date().toISOString().split('T')[0];
        
        await updateDoc(institucionRef, {
          nombre: datosActualizados.nombre,
          estado: datosActualizados.estado || institucionActual.estado || 'activo',
          'contrato.asignadas': datosActualizados.consultas,
          'contrato.duracionMeses': datosActualizados.duracion,
          'contrato.fechaFin': calcularFechaVencimiento(fechaInicioOriginal, datosActualizados.duracion)
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error al editar institución:", error);
      return { success: false, error: error.message };
    }
  };

  // Eliminar institución
  const eliminarInstitucion = async (id) => {
    try {
      await deleteDoc(doc(db, 'instituciones', id));
      console.log("Institución eliminada exitosamente");
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar institución:", error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Registrar consumo mensual
  const registrarConsumoMensual = async (id, datosConsumo) => {
    try {
      const institucionRef = doc(db, 'instituciones', id);
      
      const institucionActual = instituciones.find(inst => inst.id === id);
      if (!institucionActual) {
        return { success: false, error: 'Institución no encontrada' };
      }

      const nuevoConsumoMes = { 
        ...institucionActual.consumoPorMes, 
        [datosConsumo.mes]: datosConsumo.consumo 
      };
      
      const totalConsumido = Object.values(nuevoConsumoMes).reduce((sum, val) => sum + val, 0);

      await updateDoc(institucionRef, {
        consumoPorMes: nuevoConsumoMes,
        'contrato.consumidas': totalConsumido
      });

      return { success: true };
    } catch (error) {
      console.error("Error al registrar consumo:", error);
      return { success: false, error: error.message };
    }
  };

  // Editar consumo mensual específico
  const editarConsumoMensual = async (id, datosConsumo) => {
    try {
      const institucionRef = doc(db, 'instituciones', id);
      
      const institucionActual = instituciones.find(inst => inst.id === id);
      if (!institucionActual) {
        return { success: false, error: 'Institución no encontrada' };
      }

      const nuevoConsumoMes = { 
        ...institucionActual.consumoPorMes, 
        [datosConsumo.mes]: datosConsumo.consumo 
      };
      
      const totalConsumido = Object.values(nuevoConsumoMes).reduce((sum, val) => sum + val, 0);

      await updateDoc(institucionRef, {
        consumoPorMes: nuevoConsumoMes,
        'contrato.consumidas': totalConsumido
      });

      return { success: true };
    } catch (error) {
      console.error("Error al editar consumo mensual:", error);
      return { success: false, error: error.message };
    }
  };

  // Eliminar consumo mensual específico
  const eliminarConsumoMensual = async (id, mesAEliminar) => {
    try {
      const institucionDoc = doc(db, 'instituciones', id);
      const institucionSnapshot = await getDoc(institucionDoc);
      
      if (!institucionSnapshot.exists()) {
        return { success: false, error: 'Institución no encontrada' };
      }
      
      const datosActuales = institucionSnapshot.data();
      const consumoPorMes = { ...datosActuales.consumoPorMes };
      const consumoEliminado = consumoPorMes[mesAEliminar] || 0;
      
      // Eliminar el mes del objeto
      delete consumoPorMes[mesAEliminar];
      
      // Recalcular consumo total
      const nuevoConsumoTotal = Object.values(consumoPorMes).reduce((sum, consumo) => sum + consumo, 0);
      
      // Actualizar en Firebase
      await updateDoc(institucionDoc, {
        consumoPorMes: consumoPorMes,
        'contrato.consumidas': nuevoConsumoTotal
      });
      
      console.log(`✅ Consumo mensual eliminado: ${mesAEliminar} (${consumoEliminado} consultas)`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error al eliminar consumo mensual:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    instituciones,
    loading,
    error,
    agregarInstitucion,
    editarInstitucion,
    eliminarInstitucion,
    registrarConsumoMensual,
    editarConsumoMensual,
    eliminarConsumoMensual
  };
};

// Hook para estadísticas del dashboard
export const useEstadisticas = () => {
  const [estadisticas, setEstadisticas] = useState({
    totalInstituciones: 0,
    totalConsultasAsignadas: 0,
    totalConsultasConsumidas: 0,
    promedioUso: 0,
    institucionesActivas: 0
  });

  const { instituciones } = useInstituciones();

  useEffect(() => {
    if (instituciones.length > 0) {
      const totalAsignadas = instituciones.reduce((sum, inst) => sum + (inst.contrato?.asignadas || 0), 0);
      const totalConsumidas = instituciones.reduce((sum, inst) => sum + (inst.contrato?.consumidas || 0), 0);
      const promedio = totalAsignadas > 0 ? (totalConsumidas / totalAsignadas) * 100 : 0;
      const activas = instituciones.filter(inst => inst.activa !== false).length;

      setEstadisticas({
        totalInstituciones: instituciones.length,
        totalConsultasAsignadas: totalAsignadas,
        totalConsultasConsumidas: totalConsumidas,
        promedioUso: promedio.toFixed(1),
        institucionesActivas: activas
      });
    } else {
      setEstadisticas({
        totalInstituciones: 0,
        totalConsultasAsignadas: 0,
        totalConsultasConsumidas: 0,
        promedioUso: 0,
        institucionesActivas: 0
      });
    }
  }, [instituciones]);

  return estadisticas;
};

// Hook para usuarios
export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuarios desde Firestore en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'usuarios'), orderBy('fechaCreacion', 'desc'));
    
    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const usuariosData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          usuariosData.push({
            id: doc.id, // ID del documento
            uid: data.uid || doc.id, // UID de Firebase Auth
            ...data,
            fechaCreacion: data.fechaCreacion?.toDate?.()?.toLocaleDateString('es-ES') || 
                           (data.fechaCreacion ? new Date(data.fechaCreacion).toLocaleDateString('es-ES') : 'N/A'),
            ultimoAcceso: data.ultimoAcceso ? 
                         new Date(data.ultimoAcceso).toLocaleString('es-ES') : 
                         'Nunca'
          });
        });
        console.log("👥 Usuarios cargados desde Firestore:", usuariosData);
        setUsuarios(usuariosData);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error al cargar usuarios:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Agregar nuevo usuario de forma segura - CORREGIDO
  const agregarUsuario = async (nuevoUsuario) => {
    try {
      setLoading(true);
      console.log("🔄 Creando usuario:", nuevoUsuario);
      
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        nuevoUsuario.email, 
        nuevoUsuario.password
      );
      
      const user = userCredential.user;
      console.log("✅ Usuario creado en Auth:", user.uid);
      
      // 2. Actualizar perfil con el nombre
      await updateProfile(user, {
        displayName: nuevoUsuario.nombre
      });
      
      // 3. Guardar datos adicionales en Firestore con el UID como ID del documento
      const usuarioData = {
        uid: user.uid,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        fechaCreacion: serverTimestamp(),
        activo: true,
        ultimoAcceso: null,
        creadoPor: auth.currentUser?.uid || 'sistema'
      };
      
      // IMPORTANTE: Usar el UID como ID del documento
      await setDoc(doc(db, 'usuarios', user.uid), usuarioData);
      console.log("✅ Usuario guardado en Firestore:", user.uid);
      
      return { success: true, uid: user.uid };
      
    } catch (error) {
      console.error("❌ Error al crear usuario:", error);
      
      let errorMessage = 'Error al crear usuario';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'El email ya está registrado';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es muy débil (mínimo 6 caracteres)';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar usuario de forma segura
  const eliminarUsuario = async (uid, nombre) => {
    try {
      // Verificar que no sea el usuario actual
      if (uid === auth.currentUser?.uid) {
        return { success: false, error: 'No puedes eliminar tu propia cuenta' };
      }
      
      // Eliminar de Firestore
      await deleteDoc(doc(db, 'usuarios', uid));
      console.log(`✅ Usuario ${nombre} eliminado de Firestore`);
      
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error al eliminar usuario:", error);
      return { success: false, error: error.message };
    }
  };

  // Cambiar estado activo/inactivo
  const toggleUsuarioActivo = async (uid) => {
    try {
      if (uid === auth.currentUser?.uid) {
        return { success: false, error: 'No puedes desactivar tu propia cuenta' };
      }

      const usuario = usuarios.find(u => u.uid === uid);
      if (!usuario) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      await updateDoc(doc(db, 'usuarios', uid), {
        activo: !usuario.activo,
        modificadoPor: auth.currentUser?.uid,
        fechaModificacion: serverTimestamp()
      });

      console.log(`✅ Estado del usuario ${usuario.nombre} cambiado`);
      return { success: true };
    } catch (error) {
      console.error("❌ Error al cambiar estado del usuario:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    usuarios,
    loading,
    error,
    agregarUsuario,
    eliminarUsuario,
    toggleUsuarioActivo
  };
};

// Hook para manejar comentarios de instituciones
export const useComentarios = (institucionId) => {
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar comentarios en tiempo real
  useEffect(() => {
    if (!institucionId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'comentarios'),
      where('institucionId', '==', institucionId),
      orderBy('fechaCreacion', 'desc')
    );
    
    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const comentariosData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          comentariosData.push({
            id: doc.id,
            ...data
          });
        });
        console.log(`💬 Comentarios cargados para institución ${institucionId}:`, comentariosData.length);
        setComentarios(comentariosData);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error al cargar comentarios:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [institucionId]);

  // Agregar nuevo comentario
  const agregarComentario = async (nuevoComentario) => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const comentarioCompleto = {
        texto: nuevoComentario.texto,
        institucionId: nuevoComentario.institucionId,
        autorNombre: auth.currentUser.displayName || auth.currentUser.email,
        autorEmail: auth.currentUser.email,
        autorUid: auth.currentUser.uid,
        fechaCreacion: serverTimestamp(),
        activo: true
      };

      const docRef = await addDoc(collection(db, 'comentarios'), comentarioCompleto);
      console.log("💬 Comentario agregado con ID:", docRef.id);
      return { success: true, id: docRef.id };
      
    } catch (error) {
      console.error("❌ Error al agregar comentario:", error);
      return { success: false, error: error.message };
    }
  };

  // Editar comentario existente
  const editarComentario = async (comentarioId, nuevoTexto) => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Verificar que el usuario actual sea el autor del comentario
      const comentario = comentarios.find(c => c.id === comentarioId);
      if (!comentario) {
        return { success: false, error: 'Comentario no encontrado' };
      }

      if (comentario.autorUid !== auth.currentUser.uid) {
        return { success: false, error: 'Solo puedes editar tus propios comentarios' };
      }

      const comentarioRef = doc(db, 'comentarios', comentarioId);
      await updateDoc(comentarioRef, {
        texto: nuevoTexto,
        fechaModificacion: serverTimestamp(),
        modificadoPor: auth.currentUser.uid
      });

      console.log("✅ Comentario editado exitosamente");
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error al editar comentario:", error);
      return { success: false, error: error.message };
    }
  };

  // Eliminar comentario
  const eliminarComentario = async (comentarioId) => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Verificar que el usuario actual sea el autor del comentario
      const comentario = comentarios.find(c => c.id === comentarioId);
      if (!comentario) {
        return { success: false, error: 'Comentario no encontrado' };
      }

      if (comentario.autorUid !== auth.currentUser.uid) {
        return { success: false, error: 'Solo puedes eliminar tus propios comentarios' };
      }

      await deleteDoc(doc(db, 'comentarios', comentarioId));
      console.log("🗑️ Comentario eliminado exitosamente");
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error al eliminar comentario:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    comentarios,
    loading,
    error,
    agregarComentario,
    editarComentario,
    eliminarComentario
  };
};

// Hook para obtener contador de comentarios por institución
export const useContadorComentarios = (institucionId) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!institucionId) return;

    const q = query(
      collection(db, 'comentarios'),
      where('institucionId', '==', institucionId),
      where('activo', '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setCount(querySnapshot.size);
    });

    return () => unsubscribe();
  }, [institucionId]);

  return count;
};