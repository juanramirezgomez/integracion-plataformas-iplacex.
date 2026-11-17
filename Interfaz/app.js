
"use strict";

/* =========================================================
   PELUDITOS PET CHILE
   Frontend - Integración de Plataformas

   Funcionalidades:
   1. Iniciar procesos BPMN en Flowable.
   2. Consultar clientes del backend Java.
   3. Mostrar la bandeja de tareas humanas.
   4. Completar tareas BPMN desde la interfaz.

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
const API_PROCESOS = `${API_BASE}/procesos`;
const API_TAREAS = `${API_BASE}/tareas`;

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

const botonActualizarTareas =
  document.getElementById("actualizarTareas");

const tablaTareas = document.getElementById("tablaTareas");
const mensajeTareas = document.getElementById("mensajeTareas");

const panelTarea = document.getElementById("panelTarea");
const tituloTarea = document.getElementById("tituloTarea");
const descripcionTarea = document.getElementById("descripcionTarea");
const formTarea = document.getElementById("formTarea");
const camposTarea = document.getElementById("camposTarea");
const cancelarTarea = document.getElementById("cancelarTarea");
const resultadoTarea = document.getElementById("resultadoTarea");

// Identificador de la tarea seleccionada.
let tareaSeleccionada = null;

// ---------------------------------------------------------
// 3. FUNCIONES AUXILIARES
// ---------------------------------------------------------

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

function mostrarMensajeTareas(texto) {
  mensajeTareas.textContent = texto;
}

// Convierte un objeto de valores en variables de Flowable.
function crearVariables(datos) {
  return Object.entries(datos).map(([name, value]) => ({
    name,
    type: typeof value === "boolean" ? "boolean" : "string",
    value
  }));
}

// Realiza una solicitud REST y controla errores HTTP.
async function solicitarJSON(url, opciones = {}) {
  const respuesta = await fetch(url, opciones);

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(
      `HTTP ${respuesta.status}: ${detalle.slice(0, 300)}`
    );
  }

  // Flowable puede responder 204 sin contenido.
  if (respuesta.status === 204) {
    return null;
  }

  const texto = await respuesta.text();
  return texto ? JSON.parse(texto) : null;
}

// Crea una fila informativa en una tabla.
function mostrarFilaVacia(tablaDestino, columnas, texto) {
  const fila = tablaDestino.insertRow();
  const celda = fila.insertCell();

  celda.colSpan = columnas;
  celda.textContent = texto;
}

// ---------------------------------------------------------
// 4. CONSULTAR CLIENTES REGISTRADOS
// ---------------------------------------------------------

async function cargarClientes() {
  try {
    botonActualizar.disabled = true;

    const respuesta = await solicitarJSON(API_CLIENTES);

    // El endpoint devuelve una lista de clientes.
    const clientes = Array.isArray(respuesta)
      ? respuesta
      : respuesta?.value ?? [];

    tabla.replaceChildren();

    if (clientes.length === 0) {
      mostrarFilaVacia(
        tabla,
        4,
        "No hay consultas registradas."
      );
      return;
    }

    clientes.forEach((cliente) => {
      const fila = tabla.insertRow();

      [
        cliente.nombreCliente,
        cliente.telefono,
        cliente.canalOrigen,
        cliente.estado
      ].forEach((valor) => {
        const celda = fila.insertCell();
        celda.textContent = valor ?? "—";
      });
    });

  } catch (error) {
    console.error("Error al cargar clientes:", error);

    mostrarMensaje(
      "No se pudo cargar el listado. Revisa la conexión con Java."
    );
  } finally {
    botonActualizar.disabled = false;
  }
}

// ---------------------------------------------------------
// 5. INICIAR UN PROCESO BPMN
// ---------------------------------------------------------

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const datos = {
    initiator: USUARIO_FLOWABLE,
    nombreCliente:
      document.getElementById("nombre").value.trim(),
    telefono:
      document.getElementById("contacto").value.trim(),
    canalOrigen:
      document.getElementById("canal").value,
    consulta:
      document.getElementById("descripcion").value.trim()
  };

  if (
    !datos.nombreCliente ||
    !datos.telefono ||
    !datos.canalOrigen ||
    !datos.consulta
  ) {
    mostrarMensaje("Completa todos los campos obligatorios.");
    return;
  }

  const botonGuardar =
    formulario.querySelector('button[type="submit"]');

  try {
    botonGuardar.disabled = true;
    mostrarMensaje("Iniciando proceso BPMN...");

    // En lugar de guardar directamente en /api/leads,
    // iniciamos una instancia del proceso en Flowable.
    const proceso = {
      message: MENSAJE_INICIO,
      variables: crearVariables(datos)
    };

    const resultado = await solicitarJSON(API_PROCESOS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(proceso)
    });

    formulario.reset();

    mostrarMensaje(
      `Proceso BPMN iniciado correctamente. ` +
      `Instancia: ${resultado?.id ?? "creada"}. ` +
      `Completa la tarea inicial desde la bandeja.`
    );

    // Consultamos las nuevas tareas humanas.
    await cargarTareas();

  } catch (error) {
    console.error("Error al iniciar proceso:", error);

    mostrarMensaje(
      "No se pudo iniciar el proceso BPMN. " +
      "Revisa la API Java y Flowable."
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

    // Flowable devuelve las tareas dentro de "data".
    const tareas = respuesta?.data ?? [];

    tablaTareas.replaceChildren();

    if (tareas.length === 0) {
      mostrarFilaVacia(
        tablaTareas,
        4,
        "No existen tareas humanas pendientes."
      );

      mostrarMensajeTareas("No hay tareas pendientes.");
      return;
    }

    tareas.forEach((tarea) => {
      const fila = tablaTareas.insertRow();

      const celdaActividad = fila.insertCell();
      celdaActividad.textContent = tarea.name ?? "Sin nombre";

      const celdaResponsable = fila.insertCell();
      celdaResponsable.textContent =
        tarea.assignee ?? "Sin asignar";

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

    mostrarMensajeTareas(
      `Tareas pendientes encontradas: ${tareas.length}.`
    );

  } catch (error) {
    console.error("Error al cargar tareas:", error);

    mostrarMensajeTareas(
      "No se pudieron consultar las tareas. " +
      "Comprueba que Flowable y Java estén funcionando."
    );
  } finally {
    botonActualizarTareas.disabled = false;
  }
}

// ---------------------------------------------------------
// 7. CREAR CAMPOS PARA UNA TAREA HUMANA
// ---------------------------------------------------------

// Definición de campos según el tipo de tarea BPMN.
// Es una implementación inicial para el prototipo.
const CAMPOS_POR_TAREA = {
  ExpandedSubProcess_4: [
    ["nombreCliente", "Nombre del cliente"],
    ["telefono", "Teléfono"],
    ["correo", "Correo electrónico"],
    ["canalOrigen", "Canal de origen"],
    ["consulta", "Descripción de la consulta"]
  ],

  ExpandedSubProcess_18: [
    ["tipoProducto", "Tipo de producto"]
  ],

  ExpandedSubProcess_24: [
    ["responsable", "Responsable asignado"]
  ],

  ExpandedSubProcess_20: [
    ["respuestaConsulta", "Respuesta al cliente"]
  ],

  ExpandedSubProcess_22: [
    ["compraRealizada", "¿Se realizó la compra?", "boolean"]
  ],

  ExpandedSubProcess_99: [
    ["fechaProximoContacto", "Fecha del próximo contacto"]
  ],

  ExpandedSubProcess_100: [
    ["resultadoContacto", "Resultado del contacto"]
  ],

  ExpandedSubProcess_101: [
    ["resultadoContacto", "Resultado del contacto"]
  ],

  ExpandedSubProcess_69: [
    ["datosActualizados", "Datos actualizados"]
  ],

  ExpandedSubProcess_30: [
    ["fechaSeguimiento", "Fecha de seguimiento"]
  ],

  ExpandedSubProcess_103: [
    ["resultadoSeguimiento", "Resultado del seguimiento"]
  ],

  ExpandedSubProcess_104: [
    ["resultadoSeguimiento", "Resultado del seguimiento"]
  ]
};

// Agrega un campo de formulario dinámicamente.
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
      ["false", "No"]
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
  input.type = "text";
  input.id = `campo_${nombre}`;
  input.name = nombre;
  input.required = nombre !== "correo";
  input.dataset.tipo = "string";

  camposTarea.appendChild(input);
}

// ---------------------------------------------------------
// 8. SELECCIONAR UNA TAREA DE LA BANDEJA
// ---------------------------------------------------------

function seleccionarTarea(tarea) {
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

    // Evita completar tareas sin sus variables necesarias.
    formTarea.querySelector('button[type="submit"]').disabled = true;
  } else {
    formTarea.querySelector('button[type="submit"]').disabled = false;

    campos.forEach(([nombre, etiqueta, tipo]) => {
      agregarCampo(nombre, etiqueta, tipo);
    });
  }

  panelTarea.hidden = false;
  panelTarea.scrollIntoView({ behavior: "smooth" });
}

// ---------------------------------------------------------
// 9. COMPLETAR TAREA HUMANA
// ---------------------------------------------------------

formTarea.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!tareaSeleccionada) {
    return;
  }

  const botonCompletar =
    formTarea.querySelector('button[type="submit"]');

  try {
    botonCompletar.disabled = true;
    resultadoTarea.textContent = "Completando tarea...";

    const datos = {};

    camposTarea.querySelectorAll("input, select").forEach((campo) => {
      datos[campo.name] = campo.dataset.tipo === "boolean"
        ? campo.value === "true"
        : campo.value.trim();
    });

    const cuerpo = {
      action: "complete",
      variables: crearVariables(datos)
    };

    await solicitarJSON(
      `${API_TAREAS}/${encodeURIComponent(tareaSeleccionada.id)}/completar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(cuerpo)
      }
    );

    panelTarea.hidden = true;
    tareaSeleccionada = null;

    mostrarMensajeTareas(
      "Tarea completada correctamente. Actualizando bandeja..."
    );

    await cargarTareas();
    await cargarClientes();

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

// Consultamos clientes y tareas al abrir la página.
cargarClientes();
cargarTareas();
