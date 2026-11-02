## Justificación de las mejoras propuestas en el TO-BE

El proceso TO-BE de Peluditos Pet Chile busca mejorar la forma en que el emprendimiento administra las consultas de sus clientes y realiza el seguimiento de posibles ventas.

Actualmente, las consultas llegan desde distintas redes sociales y no existe un sistema centralizado para registrar la información y realizar un seguimiento ordenado.

Con la solución propuesta se busca:

1. **Centralizar las consultas:** registrar en una plataforma las solicitudes recibidas desde los distintos canales de comunicación.
2. **Organizar la información de los clientes:** identificar si un cliente ya existe y evitar registros duplicados.
3. **Automatizar tareas:** permitir que el sistema clasifique las consultas, asigne responsables y programe seguimientos, disminuyendo el trabajo manual.
4. **Mejorar las oportunidades de venta:** realizar seguimiento a los clientes interesados que todavía no concretan una compra.
5. **Fomentar la recompra:** programar contactos posteriores con clientes que hayan autorizado recibir comunicaciones comerciales.
6. **Mantener un historial:** registrar las compras, los contactos y sus resultados para facilitar futuras decisiones.

La principal mejora es que la encargada del emprendimiento no tendrá que administrar manualmente cada consulta o recordar cuándo contactar nuevamente a un cliente. El sistema podrá encargarse de las actividades repetitivas, mientras ella se concentra en atender a los clientes y gestionar las ventas.

Esta propuesta representa el funcionamiento esperado de la plataforma. Su implementación se realizará progresivamente mediante Flowable y los servicios web definidos por el equipo.

## Lo que pude probar al 2 de noviembre

Preparé este TO-BE para ejecutarlo en Flowable 8. Dejé identificadas las tareas que hace una persona y las que toma el worker. También cambié el inicio para que reciba el mensaje ConsultaClienteRecibida desde la API.

El worker pudo buscar al cliente, crear su registro y cambiar su estado cuando compró. La clasificación, la asignación y los contactos quedaron como tareas de usuario. Por ahora las completé desde la API; falta hacerlo desde nuestra pantalla.

Para revisar el proceso completo usé esperas de 10 segundos. Nos falta configurar las fechas que correspondan al uso real. Mantuve la espera dentro del mismo proceso, que el profesor aceptó para este prototipo.
