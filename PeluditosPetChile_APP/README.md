# Instalación de Peluditos Pet Chile para Windows

El paquete reúne el dashboard, el servicio Java con Jakarta REST, Flowable OSS 8.0.0, los dos modelos BPMN y el worker de PowerShell. Está preparado para instalarse en un computador Windows y usarse desde el navegador de ese mismo equipo.

## Requisitos

- Windows 10 u 11 de 64 bits con Windows PowerShell 5.1, `curl.exe` y un navegador.
- Permiso para escribir en la carpeta del paquete y tres puertos locales disponibles.
- El paquete incluye Java 21 (Temurin), el archivo WAR de Flowable, el JAR de Java y el servidor web local. Las dos bases H2 se crean al iniciar.

## Primer inicio

1. Descarga el repositorio como ZIP, extráelo y abre `PeluditosPetChile_APP`. Mantén juntos los archivos y carpetas del paquete.
2. Ejecuta [Iniciar_Peluditos.bat](Iniciar_Peluditos.bat). El script prepara las credenciales y las bases, inicia Flowable y Java, despliega los BPMN y levanta el worker y la interfaz.
3. Espera a que abra el navegador. La dirección predeterminada es `http://localhost:5173`. Si el navegador queda cerrado, abre la dirección que imprime el iniciador.
4. En **Estado de integración**, comprueba que Java y Flowable indiquen **Disponible**. Registra una consulta con datos ficticios y actualiza **Tareas BPMN** hasta que aparezca «Clasificar consulta». Eso verifica que el proceso arrancó y que el worker hizo la búsqueda y el registro en Java.

Consulta la [guía de uso](../Interfaz/GUIA-DE-USO.md) para seguir el recorrido hasta su resultado.

## Cambiar los puertos

Detén esta copia con [Detener_Peluditos.bat](Detener_Peluditos.bat). En el primer inicio se copia [instalacion.ejemplo.json](instalacion.ejemplo.json) a `.local/instalacion.json`. Para fijar puertos antes de ese primer inicio, crea `.local`, copia ahí el ejemplo con el nombre `instalacion.json` y edítalo.

| Parámetro | Valor inicial | Uso |
| --- | ---: | --- |
| `puertoWeb` | 5173 | Dirección que se abre en el navegador. |
| `puertoJava` | 8096 | API interna a la que apunta el servidor web. |
| `puertoFlowable` | 8098 | Motor al que se conectan Java y el worker. |

Usa tres enteros distintos entre 1024 y 65535. Al iniciar se regeneran las propiedades y se actualizan las conexiones a partir de esos valores. La interfaz usa `/api` en su misma dirección, por lo que el cambio de puertos se hace en un solo archivo. Los servicios se mantienen en el equipo local.

Si un puerto está ocupado, el iniciador avisa y puedes elegir otro en la configuración. Si la copia ya está activa, usa primero su propio botón de apagado.

## Datos, apagado y recuperación

- [Detener_Peluditos.bat](Detener_Peluditos.bat) cierra los servicios que registró esta copia. Cerrar el navegador por sí solo deja los servicios activos.
- Java conserva contactos y consultas en `.local/datos-negocio/clientes.mv.db`. Flowable conserva instancias, tareas e historial en `.local/datos-motor/flowable.mv.db`. H2 guarda cada base por separado. El esquema se prepara al iniciar Flowable y el servicio Java.
- Para respaldar los datos, detén el paquete y copia la carpeta `.local` a un lugar privado. Conserva esta carpeta al actualizar la aplicación. Incluye las credenciales generadas para esa instalación.
- Si el arranque falla, revisa `.local/motor-err.log`, `.local/java-err.log`, `.local/web-err.log` o `.local/worker-err.log`. Las operaciones del worker quedan en `.local/worker-ejecucion.jsonl`.

El envío de correos requiere configurar un servidor SMTP y probar la cuenta autorizada. Mantén las credenciales fuera del repositorio. El registro de WhatsApp o Instagram identifica el canal de origen. La comunicación se realiza desde el canal que utilice el negocio.

La demostración de seguimiento usa un temporizador de diez segundos y conserva la fecha ingresada como dato de la consulta. La recompra se crea manualmente desde el dashboard.
