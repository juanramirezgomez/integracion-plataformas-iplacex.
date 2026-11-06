# Peluditos Pet Chile

**Integración de Plataformas · Grupo 05**

## Integrantes

- Juan Andrés Ramírez Gómez — análisis y modelos BPMN.
- Jorge Alberto Cerda Rodríguez — servicios web Java.
- Marcelo Daniel Valenzuela Valenzuela — Flowable e integración.

## Objetivo

Registrar las consultas de Peluditos Pet Chile, identificar por qué canal llegaron y darles seguimiento. Si el cliente compra, el proceso deja registrado el cambio de estado y permite organizar un próximo contacto.

## Componentes y arquitectura

| Componente | Función |
| --- | --- |
| [Pantalla web](Proyecto-2/Frontend/) | Inicia consultas, muestra los clientes registrados y permite avanzar las tareas desde la bandeja. |
| [Servicio Java](Java-Web-Services/) | Expone los servicios con Jakarta REST y Jersey. Guarda los clientes en una base H2 local. |
| [Flowable OSS 8 y worker](Flowable/Entrega-2/) | Flowable ejecuta el [TO-BE](BPMN/TO-BE.bpmn). El worker consulta o actualiza al cliente en Java y devuelve el resultado a Flowable. |

La pantalla se comunica con Java para iniciar el proceso y completar tareas. Flowable guarda las instancias y su historial en un archivo H2 separado de la base de clientes.

## Avance de la Entrega 2

- **2 de noviembre.** Ajustamos el servicio a Jakarta REST y probamos por API el recorrido con compra y el de un cliente existente sin compra. También reiniciamos Flowable y Java y comprobamos que los datos siguieran guardados.
- **5 de noviembre.** Se agregó la pantalla del grupo y su conexión con Flowable a través de Java. El historial del motor registra dos recorridos terminados, [con compra](Pruebas/Entrega-2/ejecucion-completa-compra.json) y [sin compra](Pruebas/Entrega-2/ejecucion-completa-sin-compra.json). En la prueba local del servicio, el cliente con compra quedó en `CONVERTIDO` y el cliente nuevo sin compra quedó en `NUEVO`.

## Cómo probarlo en Windows

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
.\Flowable\Entrega-2\iniciar-local.ps1 -FlowableWar "C:\ruta\flowable-8.0.0\wars\flowable-rest.war"
```

Cuando los servicios respondan, puedes abrir la [consola de Flowable](http://127.0.0.1:8098/flowable-rest/docs/).

### 3. Cargar el TO-BE

Si el motor local todavía no tiene el modelo cargado, ejecuta esto desde la raíz del repo.

```powershell
$auth = 'Authorization: Basic ' + (Get-Content .\.local\auth.txt -Raw).Trim()
$flow = 'http://127.0.0.1:8098/flowable-rest/service'
curl.exe -fsS -H $auth -F "file=@BPMN/TO-BE.bpmn" "$flow/repository/deployments"
```

### 4. Arrancar el worker

Abre otro PowerShell en la raíz del repo y deja esa ventana abierta durante la prueba.

```powershell
.\Flowable\Entrega-2\worker.ps1 -TokenPath .\.local\auth.txt -AuthScheme Basic -FlowableBase http://127.0.0.1:8098/flowable-rest -JavaBase http://127.0.0.1:8096
```

### 5. Abrir la pantalla del grupo

En otra ventana de PowerShell, desde la raíz del repo, ejecuta:

```powershell
npx.cmd --yes http-server .\Proyecto-2\Frontend -p 5173 -a 127.0.0.1
```

Abre [Peluditos en local](http://127.0.0.1:5173/). Registra una consulta con datos de prueba y completa su primera tarea desde la bandeja. Usa **Actualizar tareas** para ver el siguiente paso cuando avance el proceso.

## Conclusión

El prototipo ya permite probar en local el recorrido de una consulta con y sin compra. Para cerrar la entrega nos falta actualizar el dibujo de arquitectura, acordar cómo quedará la pantalla que verá la dueña y agregar los enlaces al video técnico y al de la emprendedora.
