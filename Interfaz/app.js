"use strict";

/* =========================================================
   PELUDITOS PET CHILE
   Frontend - Integración de Plataformas

   Funcionalidades:
1. Iniciar procesos BPMN en Flowable.
2. Consultar clientes del backend Java.
3. Mostrar la bandeja de tareas humanas.
4. Completar tareas BPMN desde la interfaz.
5. Ver detalle, editar cliente, enviar correo y ver actividad.

   Arquitectura:
   HTML/JavaScript -> API Java -> Flowable OSS
                                  -> External Worker
                                  -> API Java / H2
   ========================================================= */

// ---------------------------------------------------------
// 1. CONFIGURACIÓN DE SERVICIOS REST
// ---------------------------------------------------------

const API_BASE = "http://127.0.0.1:8096/api";

const API_CLIENTES = `${API_BASE}/leads`;
const API_CONSULTAS = `${API_BASE}/consultas`;
const API_PROCESOS = `${API_BASE}/procesos`;
const API_TAREAS = `${API_BASE}/tareas`;
const API_CORREOS = `${API_BASE}/correos`;
const API_ACTIVIDAD = `${API_BASE}/actividad`;

const STORAGE_ACTIVIDAD_KEY = "peluditos_actividad_v1";
const STORAGE_OVERRIDES_KEY = "peluditos_overrides_v1";
const STORAGE_GESTION_KEY = "peluditos_detalle_gestion_v1";

const ETIQUETAS_GESTION = {
  tipoProducto: "Tipo de producto",
  responsable: "Responsable asignado",
  respuestaConsulta: "Respuesta al cliente",
  fechaSeguimiento: "Fecha de seguimiento programada",
  fechaProximoContacto: "Fecha de próximo contacto",
  resultadoContacto: "Resultado del contacto",
  resultadoSeguimiento: "Resultado del seguimiento",
  datosActualizados: "Datos actualizados"
};

// Mensaje que inicia el proceso BPMN.
const MENSAJE_INICIO = "ConsultaClienteRecibida";

// Usuario de demostración del motor Flowable.
const USUARIO_FLOWABLE = "peluditos-local";

// ---------------------------------------------------------
// 2. ELEMENTOS DEL HTML
// ---------------------------------------------------------

const formulario = document.getElementById("consultaForm");
const mensaje = document.getElementById("mensaje");
const botonActualizar = document.getElementById("actualizar");
const tabla = document.getElementById("tablaConsultas");

const botonActualizarTareas = document.getElementById("actualizarTareas");

const tablaTareas = document.getElementById("tablaTareas");
const mensajeTareas = document.getElementById("mensajeTareas");

const panelTarea = document.getElementById("panelTarea");
const tituloTarea = document.getElementById("tituloTarea");
const descripcionTarea = document.getElementById("descripcionTarea");
const formTarea = document.getElementById("formTarea");
const camposTarea = document.getElementById("camposTarea");
const cancelarTarea = document.getElementById("cancelarTarea");
const resultadoTarea = document.getElementById("resultadoTarea");

// Elementos de la vista de detalle, edición, correo y actividad.
const seccionClientes = document.getElementById("seccionClientes");
const panelDetalleCliente = document.getElementById("panelDetalleCliente");
const volverListado = document.getElementById("volverListado");
const detalleTitulo = document.getElementById("detalleTitulo");
const detalleSubtitulo = document.getElementById("detalleSubtitulo");

const formEditarCliente = document.getElementById("formEditarCliente");
const editNombre = document.getElementById("editNombre");
const editTelefono = document.getElementById("editTelefono");
const editCorreo = document.getElementById("editCorreo");
const editCanal = document.getElementById("editCanal");
const editConsulta = document.getElementById("editConsulta");
const editResultado = document.getElementById("editResultado");
const mensajeEdicion = document.getElementById("mensajeEdicion");

const formEnviarCorreo = document.getElementById("formEnviarCorreo");
const correoDestinatario = document.getElementById("correoDestinatario");
const correoAsunto = document.getElementById("correoAsunto");
const correoCuerpo = document.getElementById("correoCuerpo");
const mensajeCorreo = document.getElementById("mensajeCorreo");
const correoImagen = document.getElementById("correoImagen");
const infoImagenCorreo = document.getElementById("infoImagenCorreo");

const listaActividad = document.getElementById("listaActividad");

const botonEliminarCliente = document.getElementById("eliminarCliente");

const detalleGestion = document.getElementById("detalleGestion");

// Estado en memoria.
let tareaSeleccionada = null;
let registroSeleccionado = null;
let registrosActuales = [];
let tareasCache = [];

// ---------------------------------------------------------
// 3. FUNCIONES AUXILIARES
// ---------------------------------------------------------

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

function mostrarMensajeTareas(texto) {
  mensajeTareas.textContent = texto;
}

function crearVariables(datos) {
  return Object.entries(datos).map(([name, value]) => ({
    name,
    type: typeof value === "boolean" ? "boolean" : "string",
    value,
  }));
}

async function solicitarJSON(url, opciones = {}) {
  const respuesta = await fetch(url, opciones);

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`HTTP ${respuesta.status}: ${detalle.slice(0, 300)}`);
  }

  if (respuesta.status === 204) {
    return null;
  }

  const texto = await respuesta.text();
  return texto ? JSON.parse(texto) : null;
}

function mostrarFilaVacia(tablaDestino, columnas, texto) {
  const fila = tablaDestino.insertRow();
  const celda = fila.insertCell();

  celda.colSpan = columnas;
  celda.textContent = texto;
}

function leerStorageJSON(clave, valorInicial) {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? JSON.parse(raw) : valorInicial;
  } catch {
    return valorInicial;
  }
}

function guardarStorageJSON(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Ignorar si localStorage no está disponible.
  }
}

function leerArchivoComoDataURL(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo leer la imagen."));
    lector.readAsDataURL(archivo);
  });
}

function obtenerClaveRegistro(item) {
  const procId = item?.procesoId ?? item?.processInstanceId;
  if (procId) {
    return `proc:${procId}`;
  }
  if (item?.leadId != null) {
    return `lead:${item.leadId}`;
  }
  if (item?.id != null) {
    return `id:${item.id}`;
  }
  return `tel:${item?.telefono ?? ""}_${item?.nombreCliente ?? ""}`;
}

function registrarActividadLocal(clave, accion, detalle) {
  if (!clave) return;
  const historial = leerStorageJSON(STORAGE_ACTIVIDAD_KEY, {});
  const eventos = Array.isArray(historial[clave]) ? historial[clave] : [];
  eventos.unshift({
    fecha: new Date().toISOString(),
    accion,
    detalle,
  });
  historial[clave] = eventos.slice(0, 50);
  guardarStorageJSON(STORAGE_ACTIVIDAD_KEY, historial);
}

// ---------------------------------------------------------
// 4. CONSULTAR CLIENTES REGISTRADOS
// ---------------------------------------------------------

async function cargarClientes() {
  try {
    botonActualizar.disabled = true;

    const [respuesta, consultas] = await Promise.all([
      solicitarJSON(API_CLIENTES),
      solicitarJSON(API_CONSULTAS),
    ]);

    const clientes = Array.isArray(respuesta)
      ? respuesta
      : (respuesta?.value ?? []);

    const listaConsultas = Array.isArray(consultas) ? consultas : [];
    const overrides = leerStorageJSON(STORAGE_OVERRIDES_KEY, {});

    const contactosConConsulta = new Set(
      listaConsultas.map((consulta) => consulta.leadId),
    );

    const baseRegistros = [
      ...listaConsultas,
      ...clientes.filter((cliente) => !contactosConConsulta.has(cliente.id)),
    ];

    const registros = baseRegistros.map((item) => {
      const clave = obtenerClaveRegistro(item);
      const ajusteLocal = overrides[clave] ?? {};
      return {
        ...item,
        ...ajusteLocal,
        _clave: clave,
      };
    });

    registrosActuales = registros;
    tabla.replaceChildren();

    if (registros.length === 0) {
      mostrarFilaVacia(tabla, 7, "No hay consultas registradas.");
      return;
    }

    const resultados = {
      PENDIENTE: "Pendiente",
      COMPRO: "Compró",
      NO_COMPRO: "No compró",
      CONVERTIDO: "Compró",
    };

    registros.forEach((cliente) => {
      const fila = tabla.insertRow();
      fila.classList.add("fila-cliente");

      const estadoTexto =
        resultados[cliente.resultado] ??
        (cliente.estado === "CONVERTIDO"
          ? "Compró"
          : "Sin resultado registrado");

      [
        cliente.nombreCliente,
        cliente.telefono,
        cliente.correo,
        cliente.canalOrigen,
        cliente.consulta,
        estadoTexto,
      ].forEach((valor) => {
        const celda = fila.insertCell();
        celda.textContent = valor ?? "—";
      });

      const celdaDetalle = fila.insertCell();
      const botonVer = document.createElement("button");
      botonVer.type = "button";
      botonVer.className = "boton-accion-tabla";
      botonVer.textContent = "Ver detalle";

      botonVer.addEventListener("click", (ev) => {
        ev.stopPropagation();
        abrirDetalleRegistro(cliente);
      });

      fila.addEventListener("click", () => {
        abrirDetalleRegistro(cliente);
      });

      celdaDetalle.appendChild(botonVer);
    });

    if (registroSeleccionado) {
      const actualizado = registros.find(
        (r) => obtenerClaveRegistro(r) === registroSeleccionado._clave,
      );
      if (actualizado) {
        registroSeleccionado = actualizado;
        renderizarGrillaGestion(obtenerGestionLocal(actualizado));
        await renderizarActividad(actualizado);
      }
    }
  } catch (error) {
    console.error("Error al cargar clientes:", error);

    mostrarMensaje(
      "No se pudo cargar el listado. Revisa la conexión con Java.",
    );
  } finally {
    botonActualizar.disabled = false;
  }
}

// ---------------------------------------------------------
// 4B. DETALLE, EDICIÓN, CORREO Y REGISTRO DE ACTIVIDAD
// ---------------------------------------------------------

function guardarGestionLocal(clavesLista, nuevosCampos) {
  if (!nuevosCampos || Object.keys(nuevosCampos).length === 0) return;
  const mapa = leerStorageJSON(STORAGE_GESTION_KEY, {});
  const clavesUnicas = [...new Set(clavesLista.filter(Boolean))];

  clavesUnicas.forEach((k) => {
    mapa[k] = { ...(mapa[k] || {}), ...nuevosCampos };
  });
  guardarStorageJSON(STORAGE_GESTION_KEY, mapa);
}

function obtenerGestionLocal(registro) {
  const mapa = leerStorageJSON(STORAGE_GESTION_KEY, {});
  const procId = registro.procesoId ?? registro.processInstanceId;
  const leadId = registro.leadId ?? registro.id;

  return {
    ...(leadId != null ? mapa[`lead:${leadId}`] : {}),
    ...(procId ? mapa[`proc:${procId}`] : {}),
    ...(mapa[registro._clave] || {}),
  };
}

function formatearFechaCorta(fechaISO) {
  if (!fechaISO || !/^\d{4}-\d{2}-\d{2}/.test(fechaISO)) return fechaISO;
  const [anio, mes, dia] = fechaISO.slice(0, 10).split("-");
  return `${dia}-${mes}-${anio}`;
}

function renderizarGrillaGestion(gestion) {
  if (!detalleGestion) return;
  detalleGestion.replaceChildren();

  const camposGestion = [
    ["tipoProducto", gestion.tipoProducto || "Sin clasificar", false],
    ["responsable", gestion.responsable || "Sin asignar", false],
    ["fechaSeguimiento", gestion.fechaSeguimiento || "No programada", false],
    ["fechaProximoContacto", gestion.fechaProximoContacto || null, false],
    ["resultadoContacto", gestion.resultadoContacto || null, false],
    ["resultadoSeguimiento", gestion.resultadoSeguimiento || null, false],
    ["datosActualizados", gestion.datosActualizados || null, false],
    ["respuestaConsulta", gestion.respuestaConsulta || "Sin respuesta registrada", true],
  ];

  camposGestion.forEach(([clave, valor, anchoCompleto]) => {
    if (valor === null) return;
    const item = document.createElement("div");
    item.className = anchoCompleto ? "detalle-item detalle-item-ancho" : "detalle-item";

    const etiqueta = document.createElement("span");
    etiqueta.className = "detalle-etiqueta";
    etiqueta.textContent = ETIQUETAS_GESTION[clave] || clave;

    const dato = document.createElement("span");
    dato.className = "detalle-valor";

    if ((clave === "fechaSeguimiento" || clave === "fechaProximoContacto") && valor !== "No programada") {
      const badge = document.createElement("span");
      badge.className = "badge-seguimiento";
      badge.textContent = formatearFechaCorta(valor);
      dato.appendChild(badge);
    } else {
      dato.textContent = valor;
    }

    item.append(etiqueta, dato);
    detalleGestion.appendChild(item);
  });
}

async function abrirDetalleRegistro(registro) {
  registroSeleccionado = registro;
  mensajeEdicion.textContent = "";
  mensajeCorreo.textContent = "";

  detalleTitulo.textContent = registro.nombreCliente || "Ficha del cliente";

  const partesSubtitulo = [];
  if (registro.telefono) partesSubtitulo.push(`Tel: ${registro.telefono}`);
  if (registro.correo) partesSubtitulo.push(`Correo: ${registro.correo}`);
  if (registro.processInstanceId) {
    partesSubtitulo.push(`Proceso: ${registro.processInstanceId}`);
  }
  detalleSubtitulo.textContent =
    partesSubtitulo.join(" · ") || "Gestión del cliente y trazabilidad";

  // Rellenar formulario de edición.
  editNombre.value = registro.nombreCliente ?? "";
  editTelefono.value = registro.telefono ?? "";
  editCorreo.value = registro.correo ?? "";
  editCanal.value = registro.canalOrigen ?? "";
  editConsulta.value = registro.consulta ?? "";
  editResultado.value =
    registro.resultado ||
    (registro.estado === "CONVERTIDO" ? "CONVERTIDO" : "PENDIENTE");

  // Prellenar correo de destino.
  correoDestinatario.value = registro.correo ?? "";
  correoAsunto.value = `Seguimiento consulta - ${registro.nombreCliente ?? "Cliente"}`;
  correoCuerpo.value = "";

  // Renderizar datos de gestión guardados localmente.
  const gestion = obtenerGestionLocal(registro);
  renderizarGrillaGestion(gestion);

  seccionClientes.hidden = true;
  panelDetalleCliente.hidden = false;
  panelDetalleCliente.scrollIntoView({ behavior: "smooth" });

  // Si hay una tarea activa para este proceso en Flowable, sincronizar variables.
  const procIdRegistro = registro.procesoId ?? registro.processInstanceId;
  const tareaDelProceso = tareasCache.find(
    (t) =>
      t.processInstanceId &&
      (t.processInstanceId === procIdRegistro ||
        t.rootProcessInstanceId === procIdRegistro)
  );
  if (tareaDelProceso) {
    solicitarJSON(`${API_TAREAS}/${encodeURIComponent(tareaDelProceso.id)}/variables`)
      .then((vars) => {
        const extraidos = {};
        (vars ?? []).forEach((v) => {
          if (
            ETIQUETAS_GESTION[v.name] &&
            v.value !== null &&
            v.value !== undefined &&
            String(v.value).trim() !== ""
          ) {
            extraidos[v.name] = String(v.value).trim();
          }
        });
        if (Object.keys(extraidos).length > 0) {
          const leadId = registro.leadId ?? registro.id;
          guardarGestionLocal(
            [
              registro._clave,
              procIdRegistro ? `proc:${procIdRegistro}` : null,
              tareaDelProceso.processInstanceId ? `proc:${tareaDelProceso.processInstanceId}` : null,
              leadId != null ? `lead:${leadId}` : null,
            ],
            extraidos
          );
          if (registroSeleccionado?._clave === registro._clave) {
            renderizarGrillaGestion({ ...gestion, ...extraidos });
          }
        }
      })
      .catch(() => {});
  }
  await renderizarActividad(registro);
}

volverListado.addEventListener("click", () => {
  panelDetalleCliente.hidden = true;
  seccionClientes.hidden = false;
  registroSeleccionado = null;
});

formEditarCliente.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!registroSeleccionado) return;

  const botonGuardar = formEditarCliente.querySelector('button[type="submit"]');
  const datosEditados = {
    nombreCliente: editNombre.value.trim(),
    telefono: editTelefono.value.trim(),
    correo: editCorreo.value.trim(),
    canalOrigen: editCanal.value,
    consulta: editConsulta.value.trim(),
    resultado: editResultado.value,
  };

  if (
    !datosEditados.nombreCliente ||
    !datosEditados.telefono ||
    !datosEditados.correo ||
    !datosEditados.canalOrigen ||
    !datosEditados.consulta
  ) {
    mensajeEdicion.textContent = "Completa todos los campos obligatorios.";
    return;
  }

  try {
    botonGuardar.disabled = true;
    mensajeEdicion.textContent = "Guardando cambios...";

    const leadId = registroSeleccionado.leadId ?? registroSeleccionado.id;
    let guardadoEnBackend = false;

    if (leadId != null) {
      try {
        await solicitarJSON(`${API_CLIENTES}/${encodeURIComponent(leadId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            ...datosEditados,
            estado:
              datosEditados.resultado === "COMPRO" ||
              datosEditados.resultado === "CONVERTIDO"
                ? "CONVERTIDO"
                : (registroSeleccionado.estado ?? "PENDIENTE"),
          }),
        });
        guardadoEnBackend = true;
      } catch (errLead) {
        console.warn("PUT /api/leads/{id} no disponible o falló:", errLead);
      }
    }

    if (registroSeleccionado.processInstanceId) {
      try {
        await solicitarJSON(
          `${API_CONSULTAS}/${encodeURIComponent(registroSeleccionado.processInstanceId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              leadId: leadId ?? undefined,
              ...datosEditados,
            }),
          },
        );
        guardadoEnBackend = true;
      } catch (errConsulta) {
        console.warn(
          "PUT /api/consultas/{id} no disponible o falló:",
          errConsulta,
        );
      }
    }

    // Guardar respaldo local para reflejar cambios de inmediato en la vista.
    const overrides = leerStorageJSON(STORAGE_OVERRIDES_KEY, {});
    overrides[registroSeleccionado._clave] = {
      ...(overrides[registroSeleccionado._clave] ?? {}),
      ...datosEditados,
    };
    guardarStorageJSON(STORAGE_OVERRIDES_KEY, overrides);

    registroSeleccionado = {
      ...registroSeleccionado,
      ...datosEditados,
    };

    registrarActividadLocal(
      registroSeleccionado._clave,
      "Actualización de datos",
      `Se actualizaron los datos del cliente (${datosEditados.nombreCliente}, ${datosEditados.telefono}, ${datosEditados.correo}) y resultado: ${datosEditados.resultado}.`,
    );

    mensajeEdicion.textContent = guardadoEnBackend
      ? "Cambios guardados en el backend."
      : "Cambios guardados en la interfaz (endpoint de actualización aún no activo en Java).";

    await cargarClientes();
    await renderizarActividad(registroSeleccionado);
  } catch (error) {
    console.error("Error al guardar cambios:", error);
    mensajeEdicion.textContent = "No se pudieron guardar los cambios.";
  } finally {
    botonGuardar.disabled = false;
  }
});

botonEliminarCliente.addEventListener("click", async () => {
  if (!registroSeleccionado) return;

  const nombre = registroSeleccionado.nombreCliente || "este cliente";
  const confirmado = window.confirm(
    `¿Estás seguro de que deseas eliminar permanentemente a "${nombre}" y sus consultas asociadas? Esta acción no se puede deshacer.`,
  );

  if (!confirmado) return;

  const leadId = registroSeleccionado.leadId ?? registroSeleccionado.id;

  try {
    botonEliminarCliente.disabled = true;

    if (leadId != null) {
      await solicitarJSON(`${API_CLIENTES}/${encodeURIComponent(leadId)}`, {
        method: "DELETE",
      });
    }

    // Limpiar respaldos locales asociados tanto por clave actual, leadId o processInstanceId.
    const clavesABorrar = new Set([registroSeleccionado._clave]);
    if (leadId != null) clavesABorrar.add(`lead:${leadId}`);
    if (registroSeleccionado.processInstanceId) {
      clavesABorrar.add(`proc:${registroSeleccionado.processInstanceId}`);
    }

    const overrides = leerStorageJSON(STORAGE_OVERRIDES_KEY, {});
    const historial = leerStorageJSON(STORAGE_ACTIVIDAD_KEY, {});
    const gestionMap = leerStorageJSON(STORAGE_GESTION_KEY, {});

    clavesABorrar.forEach((clave) => {
      delete overrides[clave];
      delete historial[clave];
      delete gestionMap[clave];
    });

    guardarStorageJSON(STORAGE_OVERRIDES_KEY, overrides);
    guardarStorageJSON(STORAGE_ACTIVIDAD_KEY, historial);
    guardarStorageJSON(STORAGE_GESTION_KEY, gestionMap);

    // Volver al listado principal y refrescar.
    panelDetalleCliente.hidden = true;
    seccionClientes.hidden = false;
    registroSeleccionado = null;

    mostrarMensaje(`El registro de "${nombre}" fue eliminado correctamente.`);
    await cargarClientes();
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    alert(
      "No se pudo eliminar el registro en el servidor. Revisa la conexión con Java.",
    );
  } finally {
    botonEliminarCliente.disabled = false;
  }
});

formEnviarCorreo.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!registroSeleccionado) return;

  const botonEnviar = formEnviarCorreo.querySelector('button[type="submit"]');
  const para = correoDestinatario.value.trim();
  const asunto = correoAsunto.value.trim();
  const mensajeTexto = correoCuerpo.value.trim();

  if (!para || !asunto || !mensajeTexto) {
    mensajeCorreo.textContent = "Completa destinatario, asunto y mensaje.";
    return;
  }

  let nombreArchivo = null;
  let tipoArchivo = null;
  let imagenBase64 = null;

  const archivoSeleccionado = correoImagen?.files?.[0] ?? null;
  if (archivoSeleccionado) {
    if (!archivoSeleccionado.type.startsWith("image/")) {
      mensajeCorreo.textContent = "Selecciona un archivo de imagen válido.";
      return;
    }
    if (archivoSeleccionado.size > 3 * 1024 * 1024) {
      mensajeCorreo.textContent = "La imagen supera el límite de 3 MB.";
      return;
    }

    const dataUrl = await leerArchivoComoDataURL(archivoSeleccionado);
    const partes = String(dataUrl).split(",");
    imagenBase64 = partes[1] ?? null;
    nombreArchivo = archivoSeleccionado.name;
    tipoArchivo = archivoSeleccionado.type;
  }

  const payloadCorreo = {
    para,
    asunto,
    mensaje: mensajeTexto,
    leadId: registroSeleccionado.leadId ?? registroSeleccionado.id ?? null,
    processInstanceId: registroSeleccionado.processInstanceId ?? null,
    nombreArchivo,
    tipoArchivo,
    imagenBase64,
  };

  try {
    botonEnviar.disabled = true;
    mensajeCorreo.textContent = "Enviando correo...";

    let enviadoBackend = false;
    try {
      await solicitarJSON(API_CORREOS, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payloadCorreo),
      });
      enviadoBackend = true;
    } catch (errCorreo) {
      console.warn("POST /api/correos no disponible o falló:", errCorreo);
    }

    const detalleAdjunto = nombreArchivo ? ` · Adjunto: ${nombreArchivo}` : "";
    registrarActividadLocal(
      registroSeleccionado._clave,
      "Correo enviado",
      `Para: ${payloadCorreo.para} · Asunto: "${payloadCorreo.asunto}"${detalleAdjunto}`,
    );

    correoCuerpo.value = "";
    if (correoImagen) correoImagen.value = "";
    if (infoImagenCorreo) infoImagenCorreo.textContent = "";

    mensajeCorreo.textContent = enviadoBackend
      ? `Correo enviado a ${payloadCorreo.para}.`
      : `Correo registrado en la bitácora para ${payloadCorreo.para} (configura POST /api/correos en Java para envío SMTP real).`;

    await renderizarActividad(registroSeleccionado);
  } catch (error) {
    console.error("Error al enviar correo:", error);
    mensajeCorreo.textContent = "No se pudo procesar el envío de correo.";
  } finally {
    botonEnviar.disabled = false;
  }
});

async function renderizarActividad(registro) {
  const historialLocal = leerStorageJSON(STORAGE_ACTIVIDAD_KEY, {});
  const eventos = [
    ...(Array.isArray(historialLocal[registro._clave])
      ? historialLocal[registro._clave]
      : []),
  ];

  // Si el backend expone /api/actividad, intentar incorporarlo.
  try {
    const params = new URLSearchParams();
    if (registro.processInstanceId) {
      params.set("procesoId", registro.processInstanceId);
    }
    const leadId = registro.leadId ?? registro.id;
    if (leadId != null) {
      params.set("leadId", String(leadId));
    }

    const queryStr = params.toString();
    const urlActividad = queryStr
      ? `${API_ACTIVIDAD}?${queryStr}`
      : API_ACTIVIDAD;

    const eventosBackend = await solicitarJSON(urlActividad);
    if (Array.isArray(eventosBackend)) {
      eventosBackend.forEach((ev) => {
        eventos.push({
          fecha: ev.fecha ?? ev.timestamp ?? new Date().toISOString(),
          accion: ev.accion ?? ev.evento ?? "Actividad del sistema",
          detalle: ev.detalle ?? ev.descripcion ?? "",
        });
      });
    }
  } catch {
    // Si /api/actividad no existe aún, se muestran los eventos locales.
  }

  // Evento base si el registro ya existía previamente.
  if (eventos.length === 0) {
    eventos.push({
      fecha: registro.fechaCreacion ?? new Date().toISOString(),
      accion: "Registro inicial",
      detalle: `Cliente ${registro.nombreCliente ?? "—"} · Canal: ${registro.canalOrigen ?? "—"} · Consulta: ${registro.consulta ?? "—"}`,
    });
  }

  listaActividad.replaceChildren();
  eventos.forEach((ev) => {
    const li = document.createElement("li");
    const spanFecha = document.createElement("span");
    spanFecha.className = "actividad-fecha";
    spanFecha.textContent = ev.fecha
      ? new Date(ev.fecha).toLocaleString("es-CL")
      : "—";

    const texto = document.createElement("div");
    texto.innerHTML = `<strong>${escaparHTML(ev.accion)}</strong>${ev.detalle ? ` — ${escaparHTML(ev.detalle)}` : ""}`;

    li.appendChild(spanFecha);
    li.appendChild(texto);
    listaActividad.appendChild(li);
  });
}

function escaparHTML(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ---------------------------------------------------------
// 5. INICIAR UN PROCESO BPMN
// ---------------------------------------------------------

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const datos = {
    initiator: USUARIO_FLOWABLE,
    nombreCliente: document.getElementById("nombre").value.trim(),
    telefono: document.getElementById("contacto").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    canalOrigen: document.getElementById("canal").value,
    consulta: document.getElementById("descripcion").value.trim(),
  };

  if (
    !datos.nombreCliente ||
    !datos.telefono ||
    !datos.correo ||
    !datos.canalOrigen ||
    !datos.consulta
  ) {
    mostrarMensaje("Completa todos los campos obligatorios.");
    return;
  }

  const botonGuardar = formulario.querySelector('button[type="submit"]');

  try {
    botonGuardar.disabled = true;
    mostrarMensaje("Registrando consulta e iniciando flujo...");

    const proceso = {
      message: MENSAJE_INICIO,
      variables: crearVariables(datos),
    };

    const resultado = await solicitarJSON(API_PROCESOS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(proceso),
    });

    const instanciaId = resultado?.id ?? null;
    const claveNueva = instanciaId
      ? `proc:${instanciaId}`
      : `tel:${datos.telefono}_${datos.nombreCliente}`;

    registrarActividadLocal(
      claveNueva,
      "Consulta registrada",
      `Cliente: ${datos.nombreCliente} · Canal: ${datos.canalOrigen} · Consulta: "${datos.consulta}"`,
    );

    // Completar automáticamente la tarea inicial "Registrar consulta" para evitar doble digitación.
    if (instanciaId) {
      try {
        const respTareas = await solicitarJSON(API_TAREAS);
        const listaTareas = respTareas?.data ?? [];
        const tareaInicial = listaTareas.find(
          (t) =>
            t.processInstanceId === instanciaId &&
            (t.taskDefinitionKey === "ExpandedSubProcess_4" ||
              (t.name && t.name.toLowerCase().includes("registrar consulta")))
        );

        if (tareaInicial) {
          await solicitarJSON(
            `${API_TAREAS}/${encodeURIComponent(tareaInicial.id)}/completar`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json; charset=utf-8",
              },
              body: JSON.stringify({
                action: "complete",
                variables: crearVariables({
                  nombreCliente: datos.nombreCliente,
                  telefono: datos.telefono,
                  correo: datos.correo,
                  canalOrigen: datos.canalOrigen,
                  consulta: datos.consulta,
                }),
              }),
            }
          );
        }
      } catch (errAuto) {
        console.warn("No se pudo autocompletar la tarea inicial:", errAuto);
      }
    }

    formulario.reset();

    mostrarMensaje(
      `Consulta registrada correctamente (Instancia: ${instanciaId ?? "creada"}). Actualizando listado y tareas...`
    );

    // Esperar brevemente a que el worker procese el alta en H2 y refrescar ambas tablas.
    await new Promise((r) => setTimeout(r, 1200));
    await Promise.all([cargarTareas(), cargarClientes()]);
    mostrarMensaje(
      `Consulta registrada correctamente (Instancia: ${instanciaId ?? "creada"}).`
    );
  } catch (error) {
    console.error("Error al iniciar proceso:", error);

    mostrarMensaje(
      "No se pudo iniciar el proceso BPMN. Revisa la API Java y Flowable.",
    );
  } finally {
    botonGuardar.disabled = false;
  }
});

// ---------------------------------------------------------
// 6. CONSULTAR TAREAS HUMANAS DE FLOWABLE
// ---------------------------------------------------------

async function cargarTareas() {
  try {
    botonActualizarTareas.disabled = true;
    mostrarMensajeTareas("Consultando tareas en Flowable...");

    const respuesta = await solicitarJSON(API_TAREAS);
    const tareas = respuesta?.data ?? [];
    tareasCache = tareas;

    tablaTareas.replaceChildren();

    if (tareas.length === 0) {
      mostrarFilaVacia(tablaTareas, 4, "No existen tareas humanas pendientes.");

      mostrarMensajeTareas("No hay tareas pendientes.");
      return;
    }

    tareas.forEach((tarea) => {
      const fila = tablaTareas.insertRow();

      const celdaActividad = fila.insertCell();
      celdaActividad.textContent = tarea.name ?? "Sin nombre";

      const celdaResponsable = fila.insertCell();
      celdaResponsable.textContent = tarea.assignee ?? "Sin asignar";

      const celdaFecha = fila.insertCell();
      celdaFecha.textContent = tarea.createTime
        ? new Date(tarea.createTime).toLocaleString("es-CL")
        : "—";

      const celdaAccion = fila.insertCell();
      const boton = document.createElement("button");

      boton.type = "button";
      boton.textContent = "Gestionar";

      boton.addEventListener("click", () => {
        seleccionarTarea(tarea);
      });

      celdaAccion.appendChild(boton);
    });

    mostrarMensajeTareas(`Tareas pendientes encontradas: ${tareas.length}.`);
  } catch (error) {
    console.error("Error al cargar tareas:", error);

    mostrarMensajeTareas(
      "No se pudieron consultar las tareas. " +
        "Comprueba que Flowable y Java estén funcionando.",
    );
  } finally {
    botonActualizarTareas.disabled = false;
  }
}

// ---------------------------------------------------------
// 7. CREAR CAMPOS PARA UNA TAREA HUMANA
// ---------------------------------------------------------

const CAMPOS_POR_TAREA = {
  ExpandedSubProcess_4: [
    ["nombreCliente", "Nombre"],
    ["telefono", "Teléfono"],
    ["correo", "Correo electrónico"],
    ["canalOrigen", "Canal de origen"],
    ["consulta", "Descripción de la consulta"],
  ],

  ExpandedSubProcess_18: [["tipoProducto", "Tipo de producto"]],

  ExpandedSubProcess_24: [["responsable", "Responsable asignado"]],

  ExpandedSubProcess_20: [["respuestaConsulta", "Respuesta al cliente"]],

  ExpandedSubProcess_22: [
    ["compraRealizada", "¿Se realizó la compra?", "boolean"],
  ],

  ExpandedSubProcess_99: [
    ["fechaProximoContacto", "Fecha del próximo contacto", "date"],
  ],

  ExpandedSubProcess_100: [["resultadoContacto", "Resultado del contacto"]],

  ExpandedSubProcess_101: [["resultadoContacto", "Resultado del contacto"]],

  ExpandedSubProcess_69: [["datosActualizados", "Datos actualizados"]],

  ExpandedSubProcess_30: [["fechaSeguimiento", "Fecha de seguimiento", "date"]],

  ExpandedSubProcess_103: [
    ["resultadoSeguimiento", "Resultado del seguimiento"],
  ],

  ExpandedSubProcess_104: [
    ["resultadoSeguimiento", "Resultado del seguimiento"],
  ],
};

function agregarCampo(nombre, etiqueta, tipo = "string") {
  const label = document.createElement("label");
  label.htmlFor = `campo_${nombre}`;
  label.textContent = etiqueta;

  camposTarea.appendChild(label);

  if (tipo === "boolean") {
    const select = document.createElement("select");
    select.id = `campo_${nombre}`;
    select.name = nombre;
    select.required = true;
    select.dataset.tipo = "boolean";

    [
      ["", "Seleccionar una opción"],
      ["true", "Sí"],
      ["false", "No"],
    ].forEach(([valor, texto]) => {
      const opcion = document.createElement("option");
      opcion.value = valor;
      opcion.textContent = texto;
      select.appendChild(opcion);
    });

    camposTarea.appendChild(select);
    return;
  }

  const input = document.createElement("input");
  if (tipo === "date") {
    input.type = "date";
  } else if (nombre === "correo") {
    input.type = "email";
  } else {
    input.type = "text";
  }

  input.id = `campo_${nombre}`;
  input.name = nombre;
  if (nombre === "correo") {
    input.maxLength = 254;
    input.pattern = document.getElementById("correo").pattern;
  }
  input.required = true;
  input.dataset.tipo = tipo;

  camposTarea.appendChild(input);
}

// ---------------------------------------------------------
// 8. SELECCIONAR UNA TAREA DE LA BANDEJA
// ---------------------------------------------------------

async function seleccionarTarea(tarea) {
  tareaSeleccionada = tarea;

  tituloTarea.textContent = tarea.name ?? "Gestionar tarea";
  descripcionTarea.textContent =
    "Completa los campos para avanzar el proceso BPMN.";

  resultadoTarea.textContent = "";
  camposTarea.replaceChildren();

  const campos = CAMPOS_POR_TAREA[tarea.taskDefinitionKey];

  if (!campos) {
    descripcionTarea.textContent =
      "Esta actividad todavía no tiene un formulario configurado.";

    formTarea.querySelector('button[type="submit"]').disabled = true;
  } else {
    formTarea.querySelector('button[type="submit"]').disabled = false;

    campos.forEach(([nombre, etiqueta, tipo]) => {
      agregarCampo(nombre, etiqueta, tipo);
    });
  }

  panelTarea.hidden = false;
  panelTarea.scrollIntoView({ behavior: "smooth" });

  const botonCompletar = formTarea.querySelector('button[type="submit"]');
  if (!campos) return;
  botonCompletar.disabled = true;
  try {
    const variables = await solicitarJSON(
      API_TAREAS + "/" + encodeURIComponent(tarea.id) + "/variables",
    );
    if (tareaSeleccionada?.id !== tarea.id) return;
    const valores = new Map(
      variables.map((variable) => [variable.name, variable.value]),
    );
    camposTarea.querySelectorAll("input, select").forEach((campo) => {
      const valor = valores.get(campo.name);
      if (valor !== undefined && valor !== null) {
        const textoValor = String(valor);
        campo.value =
          campo.type === "date" && textoValor.length >= 10
            ? textoValor.slice(0, 10)
            : textoValor;
      }
    });
    botonCompletar.disabled = false;
  } catch (error) {
    if (tareaSeleccionada?.id === tarea.id) {
      resultadoTarea.textContent =
        "No se pudieron recuperar los datos. Vuelve a abrir la tarea.";
    }
  }
}

// ---------------------------------------------------------
// 9. COMPLETAR TAREA HUMANA
// ---------------------------------------------------------

formTarea.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!tareaSeleccionada) {
    return;
  }

  const botonCompletar = formTarea.querySelector('button[type="submit"]');

  try {
    botonCompletar.disabled = true;
    resultadoTarea.textContent = "Completando tarea...";

    const datos = {};

    camposTarea.querySelectorAll("input, select").forEach((campo) => {
      datos[campo.name] =
        campo.dataset.tipo === "boolean"
          ? campo.value === "true"
          : campo.value.trim();
    });

    // 1. Recuperar variables de contexto de la tarea antes de completarla
    let varsContexto = [];
    try {
      varsContexto = await solicitarJSON(
        `${API_TAREAS}/${encodeURIComponent(tareaSeleccionada.id)}/variables`,
      );
    } catch {
      varsContexto = [];
    }

    const mapaVars = new Map(
      (varsContexto ?? []).map((v) => [v.name, v.value]),
    );
    const leadIdVar = mapaVars.get("leadId");
    const correoVar = mapaVars.get("correo");
    const telVar = mapaVars.get("telefono");

    const procesoIdTarea = tareaSeleccionada.processInstanceId ?? null;
    const rootProcesoIdTarea = tareaSeleccionada.rootProcessInstanceId ?? null;

    // 2. Buscar el registro del cliente en memoria para obtener su clave exacta
    const registroCoincidente = registrosActuales.find((r) => {
      const procR = r.procesoId ?? r.processInstanceId;
      if (procR && (procR === procesoIdTarea || procR === rootProcesoIdTarea)) {
        return true;
      }
      if (leadIdVar != null && String(r.leadId ?? r.id) === String(leadIdVar)) {
        return true;
      }
      if (
        correoVar &&
        r.correo &&
        r.correo.toLowerCase() === String(correoVar).toLowerCase()
      ) {
        return true;
      }
      if (telVar && r.telefono && String(r.telefono) === String(telVar)) {
        return true;
      }
      return false;
    });

    // 3. Completar la tarea en Flowable
    const cuerpo = {
      action: "complete",
      variables: crearVariables(datos),
    };

    await solicitarJSON(
      `${API_TAREAS}/${encodeURIComponent(tareaSeleccionada.id)}/completar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(cuerpo),
      },
    );

    // 4. Guardar los datos de gestión y registrar la actividad bajo todas las claves asociadas
    const clavesDestino = [
      procesoIdTarea ? `proc:${procesoIdTarea}` : null,
      rootProcesoIdTarea ? `proc:${rootProcesoIdTarea}` : null,
      leadIdVar != null ? `lead:${leadIdVar}` : null,
      registroCoincidente?._clave ?? null,
    ].filter(Boolean);

    if (clavesDestino.length > 0) {
      const camposGuardables = {};
      const resumenVars = [];

      Object.entries(datos).forEach(([k, v]) => {
        if (ETIQUETAS_GESTION[k] && v !== "") {
          camposGuardables[k] = String(v);
          resumenVars.push(`${ETIQUETAS_GESTION[k]}: ${String(v)}`);
        } else if (v !== "") {
          resumenVars.push(`${k}: ${String(v)}`);
        }
      });

      if (Object.keys(camposGuardables).length > 0) {
        guardarGestionLocal(clavesDestino, camposGuardables);
      }

      const detalleActividad =
        resumenVars.join(" · ") || "Sin variables adicionales";
      const nombreTarea =
        tareaSeleccionada.name ??
        tareaSeleccionada.taskDefinitionKey ??
        "Tarea";

      clavesDestino.forEach((claveDest) => {
        registrarActividadLocal(
          claveDest,
          `Tarea completada: ${nombreTarea}`,
          detalleActividad,
        );
      });

      solicitarJSON(API_ACTIVIDAD, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          leadId:
            leadIdVar ??
            registroCoincidente?.leadId ??
            registroCoincidente?.id ??
            null,
          procesoId: rootProcesoIdTarea ?? procesoIdTarea,
          accion: `Tarea completada: ${nombreTarea}`,
          detalle: detalleActividad,
        }),
      }).catch(() => {});

      // Si el usuario tiene abierta la ficha de este cliente, refrescar al instante
      if (
        registroSeleccionado &&
        clavesDestino.includes(registroSeleccionado._clave)
      ) {
        renderizarGrillaGestion(obtenerGestionLocal(registroSeleccionado));
        await renderizarActividad(registroSeleccionado);
      }
    }

    panelTarea.hidden = true;
    tareaSeleccionada = null;

    mostrarMensajeTareas(
      "Tarea completada correctamente. Actualizando bandeja...",
    );

    // Dar un breve margen para que el worker avance la siguiente etapa antes de refrescar.
    await new Promise((r) => setTimeout(r, 900));
    await Promise.all([cargarTareas(), cargarClientes()]);
  } catch (error) {
    console.error("Error al completar tarea:", error);

    resultadoTarea.textContent =
      "No se pudo completar la tarea. Revisa Java y Flowable.";
  } finally {
    botonCompletar.disabled = false;
  }
});

// ---------------------------------------------------------
// 10. CANCELAR GESTIÓN DE TAREA
// ---------------------------------------------------------

cancelarTarea.addEventListener("click", () => {
  panelTarea.hidden = true;
  tareaSeleccionada = null;
  resultadoTarea.textContent = "";
});

// ---------------------------------------------------------
// 11. EVENTOS DE ACTUALIZACIÓN
// ---------------------------------------------------------

botonActualizar.addEventListener("click", cargarClientes);

botonActualizarTareas.addEventListener("click", cargarTareas);

// ---------------------------------------------------------
// 12. CARGA INICIAL
// ---------------------------------------------------------

cargarClientes();
cargarTareas();