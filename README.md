# Peluditos Pet Chile

**Integración de Plataformas · Grupo 05**

## Integrantes

- Juan Andrés Ramírez Gómez — análisis y modelos BPMN.
- Jorge Alberto Cerda Rodríguez — servicios web Java.
- Marcelo Daniel Valenzuela Valenzuela — Flowable e integración.

## Objetivo

Registrar y dar seguimiento a las consultas por tortas para mascotas de Peluditos Pet Chile, dejando anotado por qué canal llegó cada una. Si un prospecto compra, el proceso registra su cambio a cliente. Las [oportunidades de recompra](BPMN/Oportunidades-Recompra.bpmn) se gestionan en un proceso aparte. La encargada las crea desde el dashboard para un cliente con una compra previa.

## Componentes y arquitectura

| Componente | Función |
| --- | --- |
| [Pantalla web](Interfaz/) | Inicia consultas, muestra los clientes registrados y permite avanzar las tareas desde la bandeja. |
| [Servicio Java](Java-Web-Services/) | Expone los servicios con Jakarta REST y Jersey. Guarda los clientes en una base H2 local. |
| [Flowable OSS 8](Flowable/) | Ejecuta el [proceso BPMN](BPMN/TO-BE.bpmn) y guarda el historial. |
| [External worker](External-Workers/worker.ps1) | Toma las tareas externas, llama a Java y devuelve el resultado a Flowable. El [registro de la prueba](Pruebas/Recorridos/worker-ejecucion.jsonl#L11-L14) muestra la llamada y la respuesta del motor. |

La pantalla se comunica con Java para iniciar el proceso y completar tareas. Flowable guarda las instancias y su historial en un archivo H2 separado de la base de clientes.

## Estructura del repositorio

- [PeluditosPetChile_APP](PeluditosPetChile_APP/) reúne el paquete de Windows y la guía de instalación.
- [BPMN](BPMN/) contiene los modelos editables y sus imágenes. [Arquitectura](Arquitectura/) explica cómo se conectan los componentes.
- [Interfaz](Interfaz/), [Java-Web-Services](Java-Web-Services/), [External-Workers](External-Workers/) y [Flowable](Flowable/) contienen el código, la guía de uso y los scripts para ejecutar la integración.
- [Pruebas](Pruebas/) reúne los resultados de las verificaciones. [Actas](Actas/) registra los avances del grupo y [Videos](Videos/) reúne los enlaces a las grabaciones.

## Avance del prototipo

- **2 de noviembre.** Ajustamos el servicio a Jakarta REST y probamos por API el recorrido con compra y el de un cliente existente sin compra. También reiniciamos Flowable y Java y comprobamos que los datos siguieran guardados.
- **5 de noviembre.** Se agregó la pantalla del grupo y su conexión con Flowable a través de Java. El historial del motor registra dos recorridos terminados, [con compra](Pruebas/Recorridos/ejecucion-completa-compra.json) y [sin compra](Pruebas/Recorridos/ejecucion-completa-sin-compra.json). En la prueba local del servicio, el cliente con compra quedó en `CONVERTIDO` y el cliente nuevo sin compra quedó en `NUEVO`.

- **18 de noviembre.** Se agregó el correo electrónico al formulario y al listado. Cada consulta guarda sus datos y muestra si está pendiente, si hubo compra o si no hubo compra. Se probaron los dos recorridos desde la página, la conexión con el worker y el guardado después de reiniciar los servicios.

- **19 de noviembre.** Probamos desde la ficha del cliente el envío de un correo con imagen a un buzón local. La página confirma el envío cuando el servidor de correo lo acepta y conserva el borrador si hay un problema. [Ver avance y pruebas](Actas/Acta-2026-11-19.md).

- **20 de noviembre.** Dejamos un paquete portátil para Windows con Java 21, Flowable OSS 8, el servicio Java, los dos BPMN y el worker.
- **23 de noviembre.** Ajustamos el arranque del paquete para que las llamadas de la interfaz a `/api` lleguen al servicio Java a través del servidor local. Ese cambio permite registrar consultas desde la pantalla del paquete.
- **24 de noviembre.** Corregimos el seguimiento de las consultas sin compra. Desde el dashboard elegimos la fecha y hora del contacto. En Flowable OSS 8 comprobamos que la tarea de contacto se habilitó a partir de la hora programada y que, al terminar el seguimiento, Java conservó el resultado «No compró». [Registro de la prueba](Pruebas/Recorridos/seguimiento-programado-final.json) · [Captura del formulario](Pruebas/Recorridos/seguimiento-fecha-pantalla.png).
- **25 de noviembre.** Corregimos la fecha de seguimiento que aparece en la ficha. Ahora cada consulta muestra su propia fecha y hora o «No programada» si aún no se agendó. Lo comprobamos con dos consultas del mismo cliente desde una sesión nueva del navegador. El cambio quedó incluido en el paquete de Windows. [Acta de avance](Actas/Acta-2026-11-25.md) · [Registro de la prueba](Pruebas/Recorridos/fechas-seguimiento-por-consulta.json).

También corregimos la eliminación de clientes. Flowable cancela las tareas, los seguimientos agendados y las recompras pendientes del cliente eliminado. Probamos que las consultas y tareas del otro cliente siguieran disponibles. [Registro de la prueba](Pruebas/Recorridos/eliminar-clientes-verificado.json).

- **26 de noviembre.** Corregimos el registro con muchas tareas pendientes y separamos los datos de gestión y el historial por consulta. Probamos dos consultas de un mismo contacto, dos contactos con el mismo nombre y distintos teléfonos, y repetimos los recorridos principales en el paquete de Windows. [Acta de avance](Actas/Acta-2026-11-26.md) · [Resultados de la revisión](Pruebas/Recorridos/verificacion-paquete-2026-11-26.json).

## Abrir el paquete para Windows

Descarga y extrae el repositorio en un computador Windows de 64 bits. Abre [PeluditosPetChile_APP](PeluditosPetChile_APP/) y ejecuta [Iniciar_Peluditos.bat](PeluditosPetChile_APP/Iniciar_Peluditos.bat). El paquete incluye Java 21, Flowable OSS 8.0.0, el dashboard y el worker.

- [Instalación, configuración y respaldo](PeluditosPetChile_APP/README.md)
- [Guía de uso para la emprendedora](Interfaz/GUIA-DE-USO.md)
- [Pruebas del paquete final](Pruebas/Recorridos/README.md#paquete-final-para-windows)

## Probar el código fuente en Windows

Necesitas Java 21, PowerShell, el archivo `flowable-rest.war` de Flowable OSS 8.0.0 y Node.js con npm para abrir la pantalla.

### 1. Compilar el servicio Java

Abre PowerShell en la raíz del repo. Ejecuta `cd ..` después de que aparezca `BUILD SUCCESS`.

```powershell
cd .\Java-Web-Services
.\mvnw.cmd clean verify
cd ..
```

### 2. Iniciar Flowable y Java

Desde la raíz del repo, cambia la ruta de ejemplo por la ubicación del WAR en tu computador.

```powershell
.\Flowable\iniciar-local.ps1 -FlowableWar "C:\ruta\flowable-8.0.0\wars\flowable-rest.war"
```

Cuando los servicios respondan, puedes abrir la [consola de Flowable](http://127.0.0.1:8098/flowable-rest/docs/).

### 3. Cargar los modelos BPMN

Para cargar las definiciones actualizadas en el motor local, ejecuta esto desde la raíz del repo.

```powershell
$auth = 'Authorization: Basic ' + (Get-Content .\.local\auth.txt -Raw).Trim()
$flow = 'http://127.0.0.1:8098/flowable-rest/service'
curl.exe -fsS -H $auth -F "file=@BPMN/TO-BE.bpmn" "$flow/repository/deployments"
curl.exe -fsS -H $auth -F "file=@BPMN/Oportunidades-Recompra.bpmn" "$flow/repository/deployments"
```

### 4. Arrancar el worker

Abre otro PowerShell en la raíz del repo y deja esa ventana abierta durante la prueba.

```powershell
.\External-Workers\worker.ps1 -TokenPath .\.local\auth.txt -AuthScheme Basic -FlowableBase http://127.0.0.1:8098/flowable-rest -JavaBase http://127.0.0.1:8096
```

### 5. Abrir la pantalla del grupo

En otra ventana de PowerShell, desde la raíz del repo, ejecuta:

```powershell
npx.cmd --yes http-server .\Interfaz -p 5173 -a 127.0.0.1
```

Para el modo de desarrollo, [config.js](Interfaz/config.js) define la URL de la API que usa la pantalla. Abre [Peluditos en local](http://127.0.0.1:5173/). Registra una consulta con datos de prueba y abre **Tareas BPMN**. La pantalla completa el registro inicial. Usa **Actualizar tareas** para ver el siguiente paso. Si el contacto es nuevo aparecerá **Clasificar consulta**. Si el teléfono ya está registrado, primero aparecerá **Revisar datos del contacto**.

## Conclusión

La encargada puede abrir una oportunidad de recompra desde la pantalla para un cliente que ya compró, revisarla y registrar el contacto o cerrarla sin contacto. El inicio es manual. [Ver cómo probarlo y las evidencias](Pruebas/Recorridos/README.md#recompra-desde-la-pantalla).

El prototipo ya permite probar en local el recorrido de una consulta con y sin compra. El [diagrama de arquitectura](Arquitectura/modelo-arquitectura.md) muestra cómo se conectan los componentes en local. Los [videos del avance anterior](Videos/Entrega-2/) están en la carpeta de videos.
