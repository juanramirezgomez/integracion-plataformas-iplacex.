# Pruebas de los recorridos

Aquí dejé los resultados de las pruebas que hice con Flowable 8 y el servicio Java actualizado a Jakarta REST.

## Qué probé

Primero comprobé que Flowable respondiera con la versión 8.0.0 y que Java pudiera consultar, registrar, cambiar el estado y borrar clientes. También probé qué pasaba al enviar datos incompletos o un ID que no existía.

Después cargué el TO-BE e inicié el proceso con un cliente ficticio. El worker lo buscó, creó su registro y cambió su estado cuando se completó la compra. El proceso llegó al final.

Volví a iniciar el proceso con el mismo cliente y seguí la ruta sin compra. También llegó al final y no creó un cliente duplicado.

Durante la prueba apagué y volví a iniciar Flowable y Java. Pude recuperar al mismo cliente y continuar desde la tarea que había quedado pendiente.

## Dónde se ve cada resultado

| Archivo | Qué dejé guardado |
|---|---|
| `resultado.json` | Resumen del recorrido con compra. |
| `historial-instancia-completa.json` | Respuesta de Flowable con la fecha de término del proceso. |
| `actividades-ejecutadas.json` | Pasos por los que pasó esa instancia. |
| `cliente-existente-sin-compra.json` | Resultado del segundo recorrido. |
| `worker-ejecucion.jsonl` | Consultas a Java y respuestas que el worker envió a Flowable. |
| `cliente-antes-reinicio.json` y `cliente-despues-reinicio.json` | El cliente antes y después de apagar los servicios. |
| `pruebas-endpoints-jakarta.json` | Códigos HTTP que devolvió el servicio en las pruebas. |
| `recorrido.json` | Registro de los pasos que fui completando. |

## Prueba del BPMN de recompra

El script también registra directamente en Java a un cliente de prueba que ya hizo una compra y abre dos oportunidades por mensaje en Flowable. Comprueba el recorrido con contacto por cumpleaños y el cierre sin contacto de una campaña. Guarda las respuestas en `resultados-recompra.json`. Estas pruebas envían el mensaje por API.

## Cómo repetir las pruebas

Primero inicié el entorno con `Flowable/iniciar-local.ps1`, como expliqué en el README principal. Después corrí:

```powershell
python .\Pruebas\Recorridos\verificar-integracion.py --war "C:\ruta\flowable-rest.war"
```

La ruta del WAR cambia según dónde lo tenga cada uno. El script usa Python 3 y PowerShell. Con `--war` también comprueba el reinicio; sin ese argumento prueba los recorridos sin apagar los servicios. Al volver a ejecutarlo, actualiza los archivos de resultados con la prueba nueva.

## Lo que falta probar desde la pantalla

Este script completa las tareas directamente por API. Falta volver a comprobar los recorridos desde la pantalla después de integrar la recompra. En el flujo de consultas, la espera de seguimiento se mantiene en 10 segundos para la prueba.

Estas pruebas locales funcionaron, pero con eso todavía no puedo explicar qué causó el bloqueo anterior en Enterprise.
