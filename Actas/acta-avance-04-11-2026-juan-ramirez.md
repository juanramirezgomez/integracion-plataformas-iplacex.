# Acta de avance del 04 y 05/11/2026

**Proyecto:** Peluditos Pet Chile  
**Grupo:** 05  
**Fecha:** 04 y 05 de noviembre de 2026

## Integrantes

- Juan Andrés Ramírez Gómez.
- Jorge Alberto Cerda Rodríguez.
- Marcelo Daniel Valenzuela Valenzuela.

## 1. Objetivo del avance

Continuar con el desarrollo de la Entrega 2 de la asignatura Integración de Plataformas, avanzando en la implementación de una solución funcional que integre una interfaz web propia, servicios REST Java, el motor de procesos Flowable OSS y los External Workers.

El propósito es permitir el registro y seguimiento de consultas de clientes del emprendimiento Peluditos Pet Chile, mediante un proceso de negocio automatizado y una interfaz accesible desde el navegador.

## 2. Avances realizados

Se desarrolló y mejoró una interfaz web utilizando HTML, CSS y JavaScript, incorporando formularios para registrar clientes y consultas, visualizar registros existentes y consultar sus estados.

Se integró el frontend con los servicios web desarrollados en Java 21 mediante Jakarta REST y Jersey, permitiendo registrar y recuperar información desde la base de datos H2.

Durante las pruebas se identificaron y corrigieron problemas de comunicación CORS entre el navegador y el backend, habilitando los orígenes locales necesarios.

Posteriormente, se incorporó la comunicación con Flowable OSS mediante servicios REST, permitiendo iniciar instancias del proceso BPMN TO-BE y administrar tareas humanas directamente desde la interfaz propia.

También se integraron los External Workers encargados de ejecutar actividades automatizadas del proceso, incluyendo la verificación de clientes, su creación cuando corresponde y el registro de compras.

Finalmente, se actualizaron las evidencias de ejecución y la documentación principal del repositorio GitHub.

## 3. Pruebas realizadas

Se verificaron las siguientes funcionalidades:

- Compilación y ejecución del backend Java en el puerto 8096.
- Consulta de clientes mediante GET /api/leads.
- Registro de clientes mediante POST /api/leads.
- Recuperación de información almacenada en H2 después de reiniciar el backend.
- Ejecución del motor Flowable OSS en el puerto 8098.
- Inicio de instancias BPMN desde la interfaz web.
- Consulta y finalización de tareas humanas desde la bandeja de tareas.
- Ejecución de actividades automatizadas mediante External Workers.
- Finalización de un recorrido completo con compra.
- Finalización de un recorrido completo sin compra.
- Consulta del historial de las instancias finalizadas.
- Comprobación de que las pruebas integradas no generaron registros duplicados de clientes.

Los recorridos principales se completaron satisfactoriamente en el entorno local de desarrollo.

## 4. Tecnologías utilizadas

- **Frontend:** HTML, CSS y JavaScript.
- **Backend:** Java 21, Maven, Jakarta REST y Jersey.
- **Motor BPMN:** Flowable OSS 8.0.0.
- **Base de datos de negocio:** H2 con persistencia en archivo.
- **Integración:** API REST y External Workers.
- **Control de versiones:** Git y GitHub.

## 5. Resultados obtenidos

Se dispone de un prototipo funcional que integra los componentes principales del sistema.

La plataforma permite registrar consultas, consultar clientes, iniciar procesos de negocio, gestionar tareas humanas y ejecutar actividades automatizadas mediante Flowable OSS.

Las pruebas realizadas permitieron comprobar el funcionamiento de los dos escenarios principales del proceso: clientes que concretan una compra y clientes que no concretan una compra.

Los avances y evidencias se encuentran publicados en la rama principal `main` del repositorio GitHub.

## 6. Actividades pendientes

- Verificar y documentar la configuración de persistencia del motor Flowable OSS.
- Completar la documentación de las decisiones de almacenamiento de datos.
- Revisar y actualizar el diagrama de arquitectura conforme a la implementación actual.
- Revisar la coherencia de los modelos BPMN AS-IS y TO-BE.
- Consolidar la documentación y las evidencias de la Entrega 2.
- Preparar el video de presentación para la emprendedora.
- Preparar el video técnico con participación de todos los integrantes.
- Incorporar los enlaces de los videos en el repositorio GitHub.

## 7. Conclusión

Durante los días 04 y 05 de noviembre de 2026, el Grupo 05 avanzó en la integración de los componentes principales de Peluditos Pet Chile, pasando de una interfaz conectada a servicios Java a un prototipo integrado con Flowable OSS.

El sistema permite demostrar recorridos funcionales completos, combinando interacción de usuarios, servicios web, persistencia de información y automatización de actividades.

Estos avances constituyen una base funcional para completar la Entrega 2 y continuar con el desarrollo y perfeccionamiento de la solución en la Entrega 3.
