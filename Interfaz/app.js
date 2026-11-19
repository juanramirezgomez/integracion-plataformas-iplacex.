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
const API_OPORTUNIDADES = `${API_BASE}/oportunidades`;
const API_CORREOS = `${API_BASE}/correos`;
const API_ACTIVIDAD = `${API_BASE}/actividad`;

const STORAGE_ACTIVIDAD_KEY = "peluditos_actividad_v1";
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

const formRecompra = document.getElementById("formRecompra");
const clienteRecompra = document.getElementById("clienteRecompra");
const mensajeRecompra = document.getElementById("mensajeRecompra");
const botonCrearOportunidad = formRecompra.querySelector('button[type="submit"]');

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
    const error = new Error(`HTTP ${respuesta.status}: ${detalle.slice(0, 300)}`);
    error.status = respuesta.status;
    throw error;
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

function mostrarClientesRecompra(clientes) {
  const seleccionado = clienteRecompra.value;
  const compradores = clientes.filter((cliente) => cliente.estado === "CONVERTIDO");
  const textoInicial = compradores.length > 0
    ? "Selecciona un cliente"
    : "Todavía no hay clientes con compra registrada";
  clienteRecompra.replaceChildren(new Option(textoInicial, ""));
  compradores.forEach((cliente) => {
    clienteRecompra.add(new Option(
      cliente.nombreCliente + " · " + cliente.telefono, String(cliente.id),
    ));
  });
  if (compradores.some((cliente) => String(cliente.id) === seleccionado)) {
    clienteRecompra.value = seleccionado;
  }
  clienteRecompra.disabled = compradores.length === 0;
  botonCrearOportunidad.disabled = clienteRecompra.disabled || formRecompra.hasAttribute("aria-busy");
}

formRecompra.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (botonCrearOportunidad.disabled) return;
  const datos = new FormData(formRecompra);
  const motivo = datos.get("motivo").trim();
  if (!motivo) {
    mensajeRecompra.textContent = "Escribe el motivo de la oportunidad.";
    return;
  }

  botonCrearOportunidad.disabled = true;
  formRecompra.setAttribute("aria-busy", "true");
  mensajeRecompra.textContent = "Creando oportunidad…";
  try {
    await solicitarJSON(API_OPORTUNIDADES, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        clienteId: Number(datos.get("clienteId")),
        motivo,
        fechaOportunidad: datos.get("fechaOportunidad"),
      }),
    });
    formRecompra.reset();
    mensajeRecompra.textContent = "Oportunidad creada. Abre «Revisar oportunidad» en la bandeja.";
    await cargarTareas();
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      mensajeRecompra.textContent = "Revisa el cliente, el motivo y la fecha de la oportunidad.";
    } else {
      mensajeRecompra.textContent = "No se pudo confirmar la creación. Revisa la bandeja antes de volver a intentar.";
    }
  } finally {
    formRecompra.removeAttribute("aria-busy");
    botonCrearOportunidad.disabled = clienteRecompra.disabled;
  }
});

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

    mostrarClientesRecompra(clientes);

    const listaConsultas = Array.isArray(consultas) ? consultas : [];

    const contactosConConsulta = new Set(
      listaConsultas.map((consulta) => consulta.leadId),
    );

    const baseRegistros = [
      ...listaConsultas,
      ...clientes.filter((cliente) => !contactosConConsulta.has(cliente.id)),
    ];

    const registros = baseRegistros.map((registro) => ({
      ...registro,
      _clave: obtenerClaveRegistro(registro),
    }));

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

function mostrarEncabezadoFicha(registro) {
  detalleTitulo.textContent = registro.nombreCliente || "Ficha del cliente";

  const partesSubtitulo = [];
  if (registro.telefono) partesSubtitulo.push(`Tel: ${registro.telefono}`);
  if (registro.correo) partesSubtitulo.push(`Correo: ${registro.correo}`);
  const procesoId = registro.procesoId ?? registro.processInstanceId;
  if (procesoId) {
    partesSubtitulo.push(`Proceso: ${procesoId}`);
  }
  detalleSubtitulo.textContent =
    partesSubtitulo.join(" · ") || "Gestión del cliente y trazabilidad";
}

async function abrirDetalleRegistro(registro) {
  registroSeleccionado = registro;
  mensajeEdicion.textContent = "";
  mensajeCorreo.textContent = "";

  mostrarEncabezadoFicha(registro);

  // Rellenar formulario de edición.
  editNombre.value = registro.nombreCliente ?? "";
  editTelefono.value = registro.telefono ?? "";
  editCorreo.value = registro.correo ?? "";
  editCanal.value = registro.canalOrigen ?? "";
  editConsulta.value = registro.consulta ?? "";
  editResultado.value =
    registro.resultado ||
    (registro.estado === "CONVERTIDO" ? "CONVERTIDO" : "");

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
  const registro = registroSeleccionado;
  const botonGuardar = formEditarCliente.querySelector('button[type="submit"]');
  if (!registro || botonGuardar.disabled) return;

  const datos = {
    nombreCliente: editNombre.value.trim(),
    telefono: editTelefono.value.trim(),
    correo: editCorreo.value.trim(),
    canalOrigen: editCanal.value,
    consulta: editConsulta.value.trim(),
  };

  if (Object.values(datos).some((valor) => !valor)) {
    mensajeEdicion.textContent = "Completa todos los campos obligatorios.";
    return;
  }

  const procesoId = registro.procesoId ?? registro.processInstanceId;
  const leadId = registro.leadId ?? registro.id;
  if (!procesoId && leadId == null) {
    mensajeEdicion.textContent = "No se encontró la ficha para guardar los cambios.";
    return;
  }

  const url = procesoId
    ? `${API_CONSULTAS}/${encodeURIComponent(procesoId)}/datos`
    : `${API_CLIENTES}/${encodeURIComponent(leadId)}`;
  botonGuardar.disabled = true;
  mensajeEdicion.textContent = "Guardando cambios...";
  try {
    const guardado = await solicitarJSON(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(datos),
    });

    registrarActividadLocal(registro._clave, "Actualización de datos", "Se guardaron los cambios de la ficha.");
    if (registroSeleccionado?._clave === registro._clave) {
      registroSeleccionado = { ...guardado, _clave: registro._clave };
      mostrarEncabezadoFicha(registroSeleccionado);
      if (correoDestinatario.value === (registro.correo ?? "")) {
        correoDestinatario.value = guardado.correo;
      }
      mensajeEdicion.textContent = "Cambios guardados.";
    }
    await cargarClientes();
  } catch (error) {
    console.error("Error al guardar cambios:", error);
    if (registroSeleccionado?._clave === registro._clave) {
      mensajeEdicion.textContent = "No se pudieron guardar los cambios. Revisa los datos o la conexión y vuelve a intentar.";
    }
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

    // Limpiar la actividad y la gestión local asociadas.
    const clavesABorrar = new Set([registroSeleccionado._clave]);
    if (leadId != null) clavesABorrar.add(`lead:${leadId}`);
    if (registroSeleccionado.processInstanceId) {
      clavesABorrar.add(`proc:${registroSeleccionado.processInstanceId}`);
    }

    const historial = leerStorageJSON(STORAGE_ACTIVIDAD_KEY, {});
    const gestionMap = leerStorageJSON(STORAGE_GESTION_KEY, {});

    clavesABorrar.forEach((clave) => {
      delete historial[clave];
      delete gestionMap[clave];
    });

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

  const registro = registroSeleccionado;
  const archivoSeleccionado = correoImagen?.files?.[0] ?? null;
  if (archivoSeleccionado && !archivoSeleccionado.type.startsWith("image/")) {
    mensajeCorreo.textContent = "Selecciona un archivo de imagen válido.";
    return;
  }
  if (archivoSeleccionado && archivoSeleccionado.size > 3 * 1024 * 1024) {
    mensajeCorreo.textContent = "La imagen supera el límite de 3 MB.";
    return;
  }

  botonEnviar.disabled = true;
  mensajeCorreo.textContent = "Enviando correo...";
  try {
    const dataUrl = archivoSeleccionado ? await leerArchivoComoDataURL(archivoSeleccionado) : null;
    const resultado = await solicitarJSON(API_CORREOS, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        para,
        asunto,
        mensaje: mensajeTexto,
        leadId: registro.leadId ?? registro.id ?? null,
        processInstanceId: registro.procesoId ?? registro.processInstanceId ?? null,
        nombreArchivo: archivoSeleccionado?.name ?? null,
        tipoArchivo: archivoSeleccionado?.type ?? null,
        imagenBase64: dataUrl?.split(",")[1] ?? null,
      }),
    });

    if (resultado?.enviado !== true || resultado.modo !== "SMTP") {
      throw new Error("Envío sin confirmación SMTP");
    }

    if (registroSeleccionado === registro) {
      correoCuerpo.value = "";
      if (correoImagen) correoImagen.value = "";
      if (infoImagenCorreo) infoImagenCorreo.textContent = "";
      mensajeCorreo.textContent = "Correo enviado a " + para + ".";
    }
  } catch (error) {
    console.error("Error al enviar correo:", error);
    if (registroSeleccionado === registro) {
      mensajeCorreo.textContent = error.status === 503
        ? "Correo no enviado. El servidor de correo todavía no está configurado."
        : "No se pudo confirmar el envío. El borrador sigue aquí.";
    }
  } finally {
    botonEnviar.disabled = false;
  }

  if (registroSeleccionado === registro) {
    await renderizarActividad(registro);
  }
});

function coincideActividad(evento, candidato, margenMs) {
  return evento.accion === candidato.accion
    && evento.detalle === candidato.detalle
    && Math.abs(Date.parse(evento.fecha) - Date.parse(candidato.fecha)) <= margenMs;
}

async function renderizarActividad(registro) {
  const historialLocal = leerStorageJSON(STORAGE_ACTIVIDAD_KEY, {});
  const guardados = historialLocal[registro._clave];
  const eventosLocales = Array.isArray(guardados) ? guardados : [];
  let eventosJava = [];

  const params = new URLSearchParams();
  const procesoId = registro.procesoId ?? registro.processInstanceId;
  const leadId = registro.leadId ?? registro.id;
  if (procesoId) params.set("procesoId", procesoId);
  if (leadId != null) params.set("leadId", String(leadId));

  if (params.size > 0) {
    try {
      const respuesta = await solicitarJSON(API_ACTIVIDAD + "?" + params);
      if (Array.isArray(respuesta)) {
        eventosJava = respuesta.map((evento) => ({
          fecha: evento.fecha ?? evento.timestamp,
          accion: evento.accion ?? evento.evento ?? "Actividad del sistema",
          detalle: evento.detalle ?? evento.descripcion ?? "",
        }));
      }
    } catch {
      // Si Java no responde, aún se puede consultar el historial local.
    }
  }

  // Las versiones anteriores guardaban la misma tarea varias veces de forma
  // local y enviaban además un evento a Java. Conservamos el registro de Java.
  const localesSinCopias = [];
  for (const evento of eventosLocales) {
    if (evento.accion?.startsWith("Tarea completada:")
        && (eventosJava.some((otro) => coincideActividad(evento, otro, 15_000))
          || localesSinCopias.some((otro) => coincideActividad(evento, otro, 1_000)))) {
      continue;
    }
    localesSinCopias.push(evento);
  }
  const eventos = [...eventosJava, ...localesSinCopias];
  eventos.sort((a, b) => (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0));
  if (registroSeleccionado?._clave !== registro._clave) return;

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

    const tareas = [];
    let pagina;
    do {
      pagina = await solicitarJSON(API_TAREAS + "?start=" + tareas.length);
      if (!pagina?.data?.length) break;
      tareas.push(...pagina.data);
    } while (tareas.length < pagina.total);
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

const TAREAS_RECOMPRA = new Set(["revisarOportunidad", "contactarCliente", "registrarResultado"]);

const CAMPOS_POR_TAREA = {
  revisarOportunidad: [["contactarCliente", "¿Corresponde contactar al cliente?", "boolean"]],

  contactarCliente: [["canalContacto", "Canal usado para el contacto"]],

  registrarResultado: [["resultadoContacto", "Resultado del contacto"]],
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
    if (TAREAS_RECOMPRA.has(tarea.taskDefinitionKey)) {
      const cliente = valores.get("nombreCliente") ?? "Cliente " + valores.get("clienteId");
      const motivo = valores.get("motivo");
      const fecha = valores.get("fechaOportunidad");
      descripcionTarea.textContent = [cliente, motivo, fecha].filter(Boolean).join(" · ");
    }
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

  const tarea = tareaSeleccionada;
  if (!tarea) {
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
        `${API_TAREAS}/${encodeURIComponent(tarea.id)}/variables`,
      );
    } catch {
      varsContexto = [];
    }

    const mapaVars = new Map(
      (varsContexto ?? []).map((v) => [v.name, v.value]),
    );
    const esRecompra = TAREAS_RECOMPRA.has(tarea.taskDefinitionKey);
    const leadIdVar = mapaVars.get(esRecompra ? "clienteId" : "leadId");
    const correoVar = mapaVars.get("correo");
    const telVar = mapaVars.get("telefono");

    const procesoIdTarea = tarea.processInstanceId ?? null;
    const rootProcesoIdTarea = tarea.rootProcessInstanceId ?? null;

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
      `${API_TAREAS}/${encodeURIComponent(tarea.id)}/completar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(cuerpo),
      },
    );

    // 4. Guardar los datos de gestión y registrar la actividad bajo todas las claves asociadas
    const clavesDestino = [...new Set([
      procesoIdTarea ? `proc:${procesoIdTarea}` : null,
      rootProcesoIdTarea ? `proc:${rootProcesoIdTarea}` : null,
      leadIdVar != null ? `lead:${leadIdVar}` : null,
      registroCoincidente?._clave ?? null,
    ].filter(Boolean))];

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
        tarea.name ??
        tarea.taskDefinitionKey ??
        "Tarea";

      const accion = `Tarea completada: ${nombreTarea}`;
      try {
        await solicitarJSON(API_ACTIVIDAD, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            leadId: leadIdVar ?? registroCoincidente?.leadId ?? registroCoincidente?.id ?? null,
            procesoId: rootProcesoIdTarea ?? procesoIdTarea,
            accion,
            detalle: detalleActividad,
          }),
        });
      } catch (error) {
        console.warn("No se pudo guardar la actividad en Java:", error);
        clavesDestino.forEach((clave) => registrarActividadLocal(clave, accion, detalleActividad));
      }

      // Si el usuario tiene abierta la ficha de este cliente, refrescar al instante
      if (
        registroSeleccionado &&
        clavesDestino.includes(registroSeleccionado._clave)
      ) {
        renderizarGrillaGestion(obtenerGestionLocal(registroSeleccionado));
        await renderizarActividad(registroSeleccionado);
      }
    }

    if (esRecompra) {
      const etapa = tarea.taskDefinitionKey;
      if (etapa === "revisarOportunidad") {
        mensajeRecompra.textContent = datos.contactarCliente
          ? "Oportunidad revisada. Continúa con «Contactar cliente»."
          : "Oportunidad cerrada sin contacto.";
      } else {
        mensajeRecompra.textContent = etapa === "contactarCliente"
          ? "Contacto registrado. Continúa con «Registrar resultado»."
          : "Resultado guardado. Oportunidad atendida.";
      }
    }

    if (tareaSeleccionada === tarea) {
      panelTarea.hidden = true;
      tareaSeleccionada = null;
    }

    mostrarMensajeTareas(
      "Tarea completada correctamente. Actualizando bandeja...",
    );

    // Dar un breve margen para que el worker avance la siguiente etapa antes de refrescar.
    await new Promise((r) => setTimeout(r, 900));
    await Promise.all([cargarTareas(), cargarClientes()]);
  } catch (error) {
    console.error("Error al completar tarea:", error);

    if (tareaSeleccionada === tarea) {
      resultadoTarea.textContent =
        "No se pudo completar la tarea. Revisa Java y Flowable.";
    }
  } finally {
    if (tareaSeleccionada === tarea) {
      botonCompletar.disabled = false;
    }
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