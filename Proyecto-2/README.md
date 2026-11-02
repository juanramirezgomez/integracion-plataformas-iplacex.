# Avance de la Entrega 2

## Implementado y comprobado

- Flowable OSS 8.0.0 ejecuta el TO-BE del equipo.
- El evento de inicio es por mensaje: ConsultaClienteRecibida.
- Las tareas están tipificadas como UserTask o tareas de worker externo.
- El servicio implementa Jakarta REST mediante Jersey, manteniendo las rutas utilizadas por el worker.
- Se ejecutaron el recorrido con compra y el de cliente existente sin compra.
- Flowable y Java usan H2 relacional en archivos separados; se comprobó el reinicio.
- Se actualizaron la documentación y el diagrama de arquitectura.

## Pendiente

La interfaz propia no está implementada en esta copia. Las pruebas completan las tareas humanas a través de la API; no equivalen a una demostración de todas las pantallas. Falta integrar la interfaz, validar la experiencia del negocio con el equipo y preparar los videos finales.

Los contactos con clientes no envían mensajes automáticos a redes sociales ni correos. La clasificación, la asignación y la actualización manual siguen representadas como tareas de usuario. La operación automática implementada en Java actualiza el estado del cliente; no registra todavía el detalle de productos o montos de una compra. Estas limitaciones deben considerarse al acordar el recorrido que se mostrará en la evaluación.

## Qué se reutilizó

Se conservó el análisis y la estructura del proceso del grupo, el modelo de datos Lead, el repositorio JPA y la operación DELETE agregada al servicio. Se incorporó la configuración ejecutable de Flowable que faltaba en el ZIP y se corrigió la implementación HTTP para cumplir la retroalimentación del docente.

Las evidencias originales del ZIP permanecen en Pruebas/Entrega-1. Las pruebas posteriores de la integración OSS se guardan en Pruebas/Entrega-2.
