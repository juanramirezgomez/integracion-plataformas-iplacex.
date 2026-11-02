# Avance de la Entrega 2

Dejé funcionando la conexión entre el TO-BE, Flowable 8, el worker y el servicio Java. Para avanzar usé el modelo y el servicio que ya teníamos en el repo.

## Lo que pude comprobar

- Ajusté los endpoints a Jakarta REST con Jersey y conservé las operaciones del servicio.
- Preparé el TO-BE con tareas de usuario y tareas para el worker. El proceso arranca con el mensaje ConsultaClienteRecibida.
- Pude completar el recorrido de un cliente nuevo que compra y el de un cliente existente que no compra.
- Guardé los datos de Flowable y de los clientes en archivos H2 separados.
- Reinicié los dos servicios y comprobé que los datos siguieran guardados.

## Lo que falta

- Conectar nuestra pantalla con Flowable y Java.
- Probar los formularios y el recorrido desde esa pantalla.
- Definir qué base de datos vamos a usar.
- Preparar los videos de la Entrega 2.

Por ahora hice las pruebas enviando las peticiones directamente por API. Los pasos de clasificación, asignación y contacto quedaron como tareas de usuario. Cuando se registra una compra, Java cambia el estado del cliente a CONVERTIDO; todavía no guarda el detalle de productos ni los montos.

El canal de origen se anota en el registro. No conecté las cuentas de redes sociales ni envié mensajes reales a clientes.

Dejé las pruebas nuevas en `Pruebas/Entrega-2`. Las de la primera entrega siguen en `Pruebas/Entrega-1`.
