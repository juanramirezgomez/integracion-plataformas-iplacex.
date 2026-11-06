
# Peluditos Pet Chile

## Integración de Plataformas – Grupo 05

  

### Proyecto para registrar las consultas de los clientes de Peluditos Pet Chile, gestionar su atención y dar seguimiento a oportunidades de compra y recompra mediante un proceso BPMN ejecutable.

## Integrantes

- Juan Andrés Ramírez Gómez: análisis y modelos BPMN.

- Jorge Alberto Cerda Rodríguez: servicios web Java.

- Marcelo Daniel Valenzuela Valenzuela: Flowable e integración.

### Objetivo

Integrar un frontend web, servicios REST en Java y Flowable OSS para administrar el ciclo de atención de clientes: desde una consulta inicial hasta la compra y fidelización, o bien el seguimiento cuando no se concreta una compra.

### Componentes y arquitectura

|Componente | Función |
|--|--|
|BPMN|Modelos AS-IS y TO-BE del proceso.|
|Java-Web-Services| Backend Java 21, Spring Boot, Jakarta REST/Jersey y persistencia H2 local.|
|Flowable/Entrega-2 | Inicio del entorno Flowable OSS 8.0.0 y External Worker en PowerShell.|
|Proyecto-2/Frontend| Interfaz HTML, CSS y JavaScript para iniciar procesos, consultar clientes y completar tareas humanas.|
|Pruebas/Entrega-1 | Evidencias de la primera entrega.|
|Pruebas/Entrega-2 | Script y evidencias de pruebas de integración y ejecución BPMN.|
|Arquitectura | Diagramas y descripción de la solución.|
|Actas |Actas y avances del equipo.|
|Proyecto-2/, Proyecto-3|Materiales de las etapas correspondientes del proyecto.|
|Videos| Documentación y enlaces de demostraciones, pendientes de completar.|

- Flujo de integración: el usuario inicia una consulta en el frontend; el backend Java inicia la instancia en  Flowable; el External Worker ejecuta las actividades automatizadas contra los servicios REST; las tareas humanas se muestran en la bandeja web y, al completarlas, Flowable continúa hasta finalizar el proceso.

## Avance del 2 de noviembre de 2026

- Se ajustó el backend a Jakarta REST con Jersey, conservando las operaciones de clientes, incluida la eliminación. Se conectó Flowable OSS 8.0.0 con el External Worker y los servicios Java. Se ejecutaron por API dos escenarios: cliente nuevo que compra y cliente existente que no compra, comprobando que no se duplicara el registro en esa prueba.

 
- Se utilizaron bases H2 persistidas en archivos separados para Flowable y clientes. Se reiniciaron los servicios para comprobar la conservación de datos. La base de datos definitiva aún debe acordarse por el equipo.

 
- En ese momento, las tareas humanas se completaban mediante la API de Flowable; la conexión de la interfaz se implementó posteriormente.

## Avance del 5 de noviembre de 2026: interfaz web y bandeja de tareas

Se integró la interfaz de Proyecto-2/Frontend/ con el backend Java y Flowable OSS. La pantalla permite:

- Iniciar instancias del proceso BPMN desde un formulario.

- Consultar los clientes registrados.

- Visualizar tareas humanas pendientes en una bandeja.

- Mostrar formularios según la actividad BPMN.

- Completar tareas humanas y registrar decisiones comerciales.

- Continuar el proceso mediante el External Worker existente.

## Se incorporó FlowableController.java con los endpoints:

### Método y ruta Función

POST /api/procesos Iniciar una instancia de proceso en Flowable.

GET /api/tareas Consultar las tareas humanas pendientes.

POST /api/tareas/{id}/completar Completar una tarea humana.

El backend también ofrece servicios de clientes como GET /api/leads, POST /api/leads y PUT /api/leads/{id}/estado. La configuración de Flowable usa propiedades y un archivo de autenticación local excluido de Git.

### External Worker

El Worker consulta tareas externas pendientes y ejecuta operaciones sobre Java:

#### Tema Acción

peluditos-verificar-cliente Buscar por teléfono en /api/leads y devolver existencia e ID.

peluditos-crear-cliente Registrar un cliente nuevo mediante POST /api/leads si corresponde.

peluditos-registrar-compra Actualizar el estado comercial mediante PUT /api/leads/{id}/estado a CONVERTIDO.

En las pruebas se utilizó el teléfono para evitar duplicaciones. No se ha validado la concurrencia de varios Workers intentando registrar simultáneamente al mismo cliente.

### Requisitos de ejecución local

- Java JDK 21 y PowerShell.

- Archivo flowable-rest.war de Flowable OSS 8.0.0.

- Node.js y npm para servir el frontend.

- Python 3 solo para ejecutar el script automatizado de pruebas existente; no es necesario para la prueba manual desde la pantalla.

1. Compilar el backend

Desde Java-Web-Services/:

.\mvnw.cmd clean verify

Asegurarse de utilizar Java 21 y configurar JAVA_HOME si fuera necesario.

2. Iniciar Flowable y Java

Desde la raíz del repositorio, reemplazando la ruta por la ubicación real del WAR:

.\Flowable\Entrega-2\iniciar-local.ps1 -FlowableWar "C:\ruta\flowable-8.0.0\wars\flowable-rest.war"

El script prepara el entorno local. Las credenciales y bases de datos locales se almacenan fuera del control de versiones.

3. Iniciar el External Worker

En otra terminal PowerShell, desde la raíz del repositorio:

.\Flowable\Entrega-2\worker.ps1 -TokenPath .\.local\auth.txt -AuthScheme Basic -FlowableBase http://127.0.0.1:8098/flowable-rest -JavaBase http://127.0.0.1:8096

Mantener el Worker en ejecución durante las pruebas manuales.

4. Iniciar el frontend

En otra terminal, desde la raíz del repositorio:

npx --yes http-server .\Proyecto-2\Frontend -p 5173 -a 127.0.0.1

Abrir http://127.0.0.1:5173.

### Direcciones de referencia

Servicio URL

Frontend http://127.0.0.1:5173

Backend Java http://127.0.0.1:8096

Clientes http://127.0.0.1:8096/api/leads

Flowable REST http://127.0.0.1:8098/flowable-rest

Documentación REST Flowable http://127.0.0.1:8098/flowable-rest/docs/

### Pruebas y evidencias

#### Pruebas automatizadas anteriores

Se dispone del script Pruebas/Entrega-2/verificar-integracion.py, que utiliza datos ficticios y recorre los casos previstos. Para ejecutarlo se requiere Python 3:

python .\Pruebas\Entrega-2\verificar-integracion.py --war "C:\ruta\flowable-8.0.0\wars\flowable-rest.war"

Al incluir --war, el script puede reiniciar Flowable y Java para comprobar persistencia. La ejecución puede actualizar archivos de resultados dentro de Pruebas/Entrega-2/.

### Pruebas manuales del 5 de noviembre de 2026

Se completaron dos instancias del proceso TO-BE desde el frontend, usando la bandeja de tareas y el External Worker:

Escenario Estado de la instancia en Flowable Estado del cliente en Java

Cliente nuevo con compra completed CONVERTIDO

Cliente nuevo sin compra completed NUEVO

- Con compra: se registró Cliente Prueba, se completaron las actividades de atención y fidelización y el Worker actualizó su estado a CONVERTIDO.

- Sin compra: se registró Cliente Sin Compra, se completaron las actividades de atención y seguimiento, y la instancia terminó; el estado del cliente permaneció NUEVO.

El historial REST de Flowable confirmó state: completed y fecha de término para ambas instancias. La consulta a /api/leads mostró los dos clientes de prueba, sin duplicados en ese resultado.

  

### Evidencias:

- Pruebas/Entrega-2/ejecucion-completa-compra.json

- Pruebas/Entrega-2/ejecucion-completa-sin-compra.json

Los JSON corresponden al historial de las instancias finalizadas. El estado NUEVO del cliente sin compra es el comportamiento actual; incorporar un estado como EN_SEGUIMIENTO es una posible mejora, aún no implementada.

### Consideraciones y limitaciones

- El entorno comprobado es local y corresponde a un prototipo académico.

- La base de datos definitiva está pendiente de decisión del equipo; se utiliza H2 en las pruebas.

- Los temporizadores BPMN de prueba utilizan tiempos reducidos y requieren ajuste para un uso real.

- La autenticación, autorización y validaciones del frontend/backend deben reforzarse antes de un despliegue productivo.

- Faltan pruebas adicionales de concurrencia, errores y escenarios alternativos.

- Se debe revisar la integración de los aportes del equipo antes de fusionar ramas.

### Estado de GitHub

La implementación de la bandeja de tareas y sus evidencias se publicó en la rama feature/bandeja-tareas-flowable, commit b28a8a6. Esta publicación no implica que los cambios ya estén fusionados con la rama principal.

### Pendientes para cerrar la Entrega 2

1. Revisar la integración con las contribuciones del equipo y la pauta de evaluación.

2. Completar o ajustar la documentación y las pruebas que correspondan.

3. Acordar la base de datos definitiva para etapas posteriores.

4. Grabar el video orientado al emprendimiento.

5. Grabar el video técnico dirigido al profesor.

6. Incorporar los enlaces de ambos videos en el repositorio.

### Conclusión

Peluditos Pet Chile dispone de un prototipo local que integra un proceso BPMN TO-BE ejecutable en Flowable OSS, servicios REST Java, automatización con External Workers y una interfaz web para completar tareas humanas. Las pruebas manuales del 5 de noviembre de 2026 confirmaron la finalización de las rutas principales con compra y sin compra. Restan tareas de documentación, revisión de integración del equipo y preparación de las demostraciones de la Entrega 2.# Peluditos Pet Chile
