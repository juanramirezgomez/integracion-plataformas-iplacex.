# Flowable y el worker

En esta carpeta dejé el inicio del entorno local y el worker que conecté con el servicio Java. Usé Flowable OSS 8.0.0 y Java 21.

El worker hace de puente: busca las tareas que Flowable tiene pendientes, consulta o modifica los datos en Java y le devuelve el resultado a Flowable para que el proceso siga.

## Cómo lo inicié

Desde la carpeta principal del repo corrí este comando, cambiando la ruta por la ubicación del WAR:

```powershell
.\Flowable\Entrega-2\iniciar-local.ps1 -FlowableWar "C:\ruta\flowable-rest.war"
```

El script inicia Flowable y Java. También prepara los archivos de configuración y las bases dentro de `.local`. La clave de acceso al motor queda en `.local/auth.txt`, fuera de lo que subimos al repo.

## Qué hace cada tarea del worker

| Tarea | Qué le pide a Java | Qué devuelve a Flowable |
|---|---|---|
| `peluditos-verificar-cliente` | Consulta `/api/leads` y busca el teléfono. | Si el cliente existe y cuál es su ID. |
| `peluditos-crear-cliente` | Registra al cliente con POST `/api/leads` si no existe. | El ID del cliente. |
| `peluditos-registrar-compra` | Cambia el estado con PUT `/api/leads/{id}/estado`. | El estado CONVERTIDO. |

En la prueba automática ejecuté el worker por ciclos. Para dejarlo funcionando mientras hacemos una prueba manual, este es el comando desde la carpeta principal:

```powershell
.\Flowable\Entrega-2\worker.ps1 -TokenPath .\.local\auth.txt -AuthScheme Basic -FlowableBase http://127.0.0.1:8098/flowable-rest -JavaBase http://127.0.0.1:8096
```

Si Java falla, el worker deja la tarea sin completar para que pueda volver a intentarse cuando venza el bloqueo. En las pruebas busqué por teléfono para no crear dos veces al mismo cliente. Todavía no probé varios workers registrando al mismo cliente al mismo tiempo.

## Cómo probé el proceso

Lo inicié enviando el mensaje `ConsultaClienteRecibida` a la API de Flowable. Después completé las tareas de usuario por esa misma API y dejé que el worker hiciera las llamadas a Java.

Las tareas de usuario son los pasos que después vamos a completar desde nuestra pantalla. Dejé sus referencias `formKey` para identificar qué formulario corresponde a cada una. Para probar las esperas usé un temporizador de 10 segundos; nos falta poner las fechas que correspondan al funcionamiento real.

La consola que viene con Flowable está en `http://127.0.0.1:8098/flowable-rest/docs/`. Desde ahí se pueden consultar los datos del motor y el historial. Guardé las respuestas que obtuve en `Pruebas/Entrega-2`.
