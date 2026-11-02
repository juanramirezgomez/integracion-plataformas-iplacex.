# Flowable OSS e integración

El proceso se despliega en Flowable OSS 8.0.0 con Java 21. El ZIP de Flowable aporta el WAR y la consola Swagger para consultar la API; no incluye las pantallas Design y Work de Enterprise.

`iniciar-local.ps1 -FlowableWar "C:\ruta\flowable-rest.war"` prepara las bases en archivos e inicia el motor y el servicio. Genera una credencial local aleatoria en `.local/auth.txt`, usada mediante Basic. No imprime contraseñas ni las incluye en el código.

La prueba integrada despliega el modelo, inicia el proceso por el mensaje `ConsultaClienteRecibida`, completa las tareas humanas por API y llama a `worker.ps1`. El worker consulta el servicio Jakarta y devuelve variables al motor:

| Tema | Operación Java | Resultado para Flowable |
|---|---|---|
| peluditos-verificar-cliente | GET /api/leads, búsqueda por teléfono | clienteRegistrado y leadId si existe |
| peluditos-crear-cliente | POST /api/leads si aún no existe | leadId |
| peluditos-registrar-compra | PUT /api/leads/{id}/estado | estadoLead=CONVERTIDO |

Para dejar el worker escuchando durante una prueba manual, ejecutar desde la raíz:

```powershell
.\Flowable\Entrega-2\worker.ps1 -TokenPath .\.local\auth.txt -AuthScheme Basic -FlowableBase http://127.0.0.1:8098/flowable-rest -JavaBase http://127.0.0.1:8096
```

La prueba automatizada lo ejecuta por ciclos cortos, sin dejar un worker permanente. Si Java falla, el worker no completa la tarea y el bloqueo vence. La búsqueda por teléfono evita duplicados en las pruebas secuenciales; no es una garantía frente a altas simultáneas de múltiples workers.

Los formularios de Enterprise no se ejecutan como interfaz en OSS. Las referencias formKey se conservan para identificar la interacción que la pantalla propia debe implementar. El temporizador es PT10S para las pruebas, no una fecha comercial definitiva.

Para revisar respuestas directamente en el motor, usar /service/management/engine y /service/history/historic-process-instances/{id}. Las respuestas reales están guardadas en Pruebas/Entrega-2. La consola de consulta forma parte de Flowable, no de una pantalla de evidencias creada por el equipo.
