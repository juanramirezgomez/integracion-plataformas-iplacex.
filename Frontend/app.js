
"use strict";

const API_URL = "http://localhost:8096/api/leads";

const formulario = document.getElementById("consultaForm");
const mensaje = document.getElementById("mensaje");
const botonActualizar = document.getElementById("actualizar");
const tabla = document.getElementById("tablaConsultas");

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

async function cargarClientes() {
  try {
    botonActualizar.disabled = true;

    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const clientes = await respuesta.json();

    tabla.replaceChildren();

    if (clientes.length === 0) {
      const fila = tabla.insertRow();
      const celda = fila.insertCell();
      celda.colSpan = 4;
      celda.textContent = "No hay consultas registradas.";
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
    console.error(error);
    mostrarMensaje(
      "No se pudo cargar el listado. Revisa la conexión con Java."
    );
  } finally {
    botonActualizar.disabled = false;
  }
}

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const cliente = {
    nombreCliente: document.getElementById("nombre").value.trim(),
    telefono: document.getElementById("contacto").value.trim(),
    canalOrigen: document.getElementById("canal").value,
    consulta: document.getElementById("descripcion").value.trim(),
    estado: "NUEVO"
  };

  if (!cliente.nombreCliente || !cliente.telefono || !cliente.consulta) {
    mostrarMensaje("Completa nombre, teléfono y descripción.");
    return;
  }

  const botonGuardar = formulario.querySelector('button[type="submit"]');

  try {
    botonGuardar.disabled = true;
    mostrarMensaje("Registrando consulta...");

    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cliente)
    });

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    formulario.reset();
    mostrarMensaje("Consulta registrada correctamente.");

    await cargarClientes();

  } catch (error) {
    console.error(error);
    mostrarMensaje(
      "No se pudo registrar la consulta. Revisa la API y la consola."
    );
  } finally {
    botonGuardar.disabled = false;
  }
});

botonActualizar.addEventListener("click", cargarClientes);

cargarClientes();
