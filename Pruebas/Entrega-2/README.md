# Pruebas de Jakarta REST y Flowable OSS 8

Estas evidencias provienen de llamadas reales al servicio Java y al motor local. No usan un motor simulado ni un panel propio para ejecutar el proceso.

## Qué comprueban

- La API del motor devuelve la versión 8.0.0.
- El servicio utiliza Jakarta REST mediante Jersey. El proyecto compila y supera su prueba de arranque.
- GET, POST, PUT y DELETE responden como se documenta; se comprueban también 400, 404 y CORS.
- El TO-BE se despliega y arranca por el mensaje ConsultaClienteRecibida.
- Un cliente nuevo recorre la ruta con compra hasta el fin.
- Una consulta del mismo cliente recorre la ruta sin compra, sin crear un duplicado.
- Se detuvieron y reiniciaron Flowable y Java durante la prueba; la tarea y el cliente se recuperaron antes de continuar.

## Archivos

`resultado.json` resume el recorrido con compra. `historial-instancia-completa.json` y `actividades-ejecutadas.json` son respuestas de Flowable. `cliente-existente-sin-compra.json` contiene la segunda instancia terminada. `worker-ejecucion.jsonl` documenta las llamadas del worker y los HTTP 204 de aceptación. `cliente-antes-reinicio.json` y `cliente-despues-reinicio.json` contienen el mismo cliente. `pruebas-endpoints-jakarta.json` registra los códigos HTTP obtenidos. `recorrido.json` registra los pasos de la prueba.

## Repetir

Iniciar el entorno como indica el README principal. Después ejecutar con Python 3:

```powershell
python .\Pruebas\Entrega-2\verificar-integracion.py --war "C:\ruta\flowable-rest.war"
```

Se requiere que el entorno se haya iniciado con `Flowable/Entrega-2/iniciar-local.ps1` para que la prueba de reinicio pueda identificar sus procesos. Sin --war se prueban los recorridos, pero no se verifica un nuevo reinicio.

## Límites

Las tareas de usuario se completan por API durante esta prueba, porque la interfaz propia del grupo sigue pendiente. El temporizador es de 10 segundos. No se envían mensajes reales a clientes ni se registran detalles de productos y montos. Estas pruebas no determinan la causa del bloqueo que hubo en Enterprise.
