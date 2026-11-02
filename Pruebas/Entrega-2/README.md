# Pruebas de la Entrega 2

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

## Cómo repetí la prueba

Primero inicié el entorno con `Flowable/Entrega-2/iniciar-local.ps1`, como expliqué en el README principal. Después corrí:

```powershell
python .\Pruebas\Entrega-2\verificar-integracion.py --war "C:\ruta\flowable-rest.war"
```

La ruta del WAR cambia según dónde lo tenga cada uno. El script usa Python 3 y PowerShell. Con `--war` también comprueba el reinicio; sin ese argumento prueba los recorridos sin apagar los servicios. Al volver a ejecutarlo, actualiza los archivos de resultados con la prueba nueva.

## Lo que falta probar desde la pantalla

En estas pruebas completé las tareas directamente por API. Falta hacerlo desde nuestra pantalla. Acorté las esperas a 10 segundos para poder revisar el recorrido completo.

Estas pruebas locales funcionaron, pero con eso todavía no puedo explicar qué causó el bloqueo anterior en Enterprise.
