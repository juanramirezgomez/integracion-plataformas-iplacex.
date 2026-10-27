# Peluditos Pet Chile — Entrega 1

Proyecto del equipo para organizar las consultas de clientes y su seguimiento.

## Integrantes

- Juan Andrés Ramírez Gómez: análisis y modelos BPMN.
- Jorge Alberto Cerda Rodríguez: servicio web Java.
- Marcelo Daniel Valenzuela Valenzuela: Flowable e integración.

## Carpetas

- `Actas`: acuerdos y actualizaciones de trabajo.
- `BPMN`: modelos AS-IS y TO-BE, imágenes y justificación de las mejoras. El TO-BE incluye correcciones de formato; aún requiere configuración para su ejecución.
- `Java-Web-Services`: servicio REST del equipo, con Java 21, Spring Boot y H2.
- `Pruebas/Entrega-1/Integracion`: evidencia y pasos de las pruebas locales.
- `Arquitectura`: pendiente el diagrama de componentes.
- `Proyecto-2` y `Proyecto-3`: carpetas reservadas, sin implementación en esta copia.
- `Videos/Entrega-1`: pendiente incorporar los enlaces a los videos.

## Revisar el avance

El servicio permite registrar una consulta, listar los registros y cambiar su estado. Sus instrucciones están en `Java-Web-Services/README.md`. Para repetir las pruebas del servicio, revisar `Pruebas/Entrega-1/Integracion/README.md`.

Se verificó la compilación con Java 21 y las operaciones REST en local. La base H2 actual es en memoria para pruebas.

## Pendientes de la primera entrega

- Configurar y ejecutar el TO-BE en Flowable Enterprise.
- Crear los formularios y el external worker que invoque el servicio Java.
- Documentar una ejecución integrada.
- Completar el diagrama de arquitectura e incorporar los dos videos.

Flowable Cloud mostró mantenimiento durante el intento de acceso. Las pruebas locales del servicio no reemplazan la demostración del proceso integrado.
