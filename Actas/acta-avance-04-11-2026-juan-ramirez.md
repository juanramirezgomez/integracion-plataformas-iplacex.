# Acta de avance del 04/11/2026

- Proyecto: Peluditos Pet Chile, Grupo 05.
- Fecha: 04/11/2026.
- Integrante: Juan Andrés Ramírez Gómez.

## Lo que avancé

Continué con el desarrollo de la Entrega 2, enfocándome en crear una pantalla propia para registrar y consultar clientes, tal como solicita la evaluación.

Desarrollé una interfaz web utilizando HTML, CSS y JavaScript, con un formulario para ingresar el nombre del cliente, teléfono, canal de origen y descripción de la consulta. También incorporé una tabla para visualizar las consultas registradas y sus estados.

Preparé el entorno con Java 21 y Maven, y ejecuté el backend Java existente. Revisé sus clases para identificar los campos y las operaciones disponibles mediante Jakarta REST con Jersey.

Durante las pruebas encontré un problema CORS entre el frontend y el backend. Revisé la configuración y habilité los orígenes locales necesarios para permitir la comunicación desde el navegador.

Finalmente, logré conectar la pantalla con los servicios Java y registrar una consulta real en la base de datos H2.

## Lo que probé

- El backend Java compiló y arrancó en el puerto 8096.
- GET /api/leads respondió con HTTP 200.
- El formulario registró una consulta mediante POST /api/leads.
- La interfaz mostró la confirmación de registro exitoso.
- La consulta apareció en el listado de clientes.
- Los datos permanecieron disponibles después de reiniciar el backend.
- El listado recuperó nuevamente los registros desde la API.

Registré como prueba a María González, con una consulta recibida por WhatsApp sobre una torta de cumpleaños para mascota. El registro quedó con estado NUEVO.

## Lo que falta

- Conectar el frontend con Flowable y el proceso BPMN TO-BE.
- Incorporar la gestión de tareas de usuario desde la pantalla.
- Probar el recorrido integrado con Flowable, external worker y Java.
- Definir con el equipo la base de datos definitiva; por ahora utilizamos H2.
- Actualizar documentación y evidencias.
- Preparar los videos de la Entrega 2.

Por ahora la interfaz registra y consulta información real mediante Jakarta REST y H2. La integración directa con Flowable sigue pendiente.

El frontend quedó respaldado en la rama feature/frontend-entrega-2.