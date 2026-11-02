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


## Alcance ejecutado al 2 de noviembre de 2026

El TO-BE se preparó para Flowable OSS 8 con tareas de usuario y de worker externo. El evento inicial recibe el mensaje ConsultaClienteRecibida. Esto permite iniciar el proceso desde una aplicación o prueba mediante la API; no conecta automáticamente las redes sociales.

La clasificación, la asignación y los contactos siguen siendo acciones humanas en esta versión. La automatización comprobada verifica el cliente, crea su registro y actualiza su estado cuando compra. Los temporizadores están acortados a 10 segundos para la demostración. La interfaz propia y las fechas comerciales definitivas aún deben integrarse.

Se conserva un solo proceso con espera para el prototipo, como aceptó el docente en su retroalimentación. Una separación futura del contacto posterior en otro proceso sigue siendo una mejora posible, no una funcionalidad implementada.
