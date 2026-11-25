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

## Registro con correo y resultado de cada consulta

Se probó el registro desde la página usando datos ficticios de Camila Soto. Se completó una consulta con compra y una segunda consulta sin compra para el mismo teléfono. El listado mostró los dos resultados y conservó el correo de cada consulta. La primera tarea recuperó los datos ya escritos en el formulario.

- `consultas-correo-resultados.png` muestra las dos consultas desde el navegador.
- `formulario-con-correo.png` muestra el formulario actualizado.
- `prueba-navegador-consultas.json` resume la comprobación desde el navegador y en tamaño de celular.
- `consultas-por-contacto.json` contiene las respuestas guardadas por Java.
- `error-recuperacion-motor.json` registra la respuesta 502 con Flowable detenido y la recuperación a 200 al reiniciarlo.
- `migracion-base-anterior.json` comprueba la actualización de una copia de la base anterior.

Las pruebas por API también comprobaron que un correo vacío o inválido devuelve 400, que un reintento conserva un único registro por proceso y que un resultado confirmado no se reemplaza por otro distinto. Se reiniciaron Java y Flowable y se recuperaron los resultados de las dos consultas.

## Cómo repetir las pruebas

Primero inicié el entorno con `Flowable/iniciar-local.ps1`, como expliqué en el README principal. Después corrí:

```powershell
python .\Pruebas\Recorridos\verificar-integracion.py --war "C:\ruta\flowable-rest.war"
```

La ruta del WAR cambia según dónde lo tenga cada uno. El script usa Python 3 y PowerShell. Con `--war` también comprueba el reinicio; sin ese argumento prueba los recorridos sin apagar los servicios. Al volver a ejecutarlo, actualiza los archivos de resultados con la prueba nueva.

## Recompra desde la pantalla

En **Oportunidades de recompra**, elige un cliente con una compra registrada, escribe el motivo y selecciona la fecha. Después de crear la oportunidad, abre **Revisar oportunidad** en la bandeja. Si corresponde contactar, registra el canal usado y completa **Registrar resultado**. Si seleccionas **No**, Flowable cierra la oportunidad sin contacto.

La oportunidad se abre manualmente. La fecha queda como dato de la oportunidad. El contacto se realiza por el canal elegido y la página permite registrar su resultado.

Probamos con datos ficticios una oportunidad por cumpleaños que terminó con contacto y otra por campaña que cerró sin contacto. También verificamos el resultado desde otra sesión del navegador y recuperamos el historial después de reiniciar Flowable 8. El servicio rechazó una fecha inválida y una solicitud para un contacto sin compra.

- [Resultado del contacto en pantalla](recompra-resultado-navegador.png)
- [Confirmación del cierre sin contacto](recompra-cierre-sin-contacto.png)
- [Historial de las dos instancias de Flowable](historial-recompra-navegador.json)

La prueba anterior usó una espera fija de 10 segundos. Ahora Flowable programa el seguimiento según la fecha y hora ingresadas.

[Registro del seguimiento programado](seguimiento-programado-final.json) · [Formulario de fecha y hora en el dashboard](seguimiento-fecha-pantalla.png)

En el paquete Windows probamos que el motor mantuvo la espera pasada la marca de 10 segundos, habilitó **Contactar cliente de seguimiento** a partir de la hora elegida y cerró la instancia en `EndNoneEvent_105`. Java conservó el resultado `NO_COMPRO`.

Estas pruebas locales funcionaron, pero con eso todavía no puedo explicar qué causó el bloqueo anterior en Enterprise.

## Edición de la ficha

Probamos editar el nombre, teléfono, correo, canal y descripción de una consulta pendiente desde el navegador. En otra sesión aparecieron los datos guardados. El worker conservó la edición cuando Flowable cerró la consulta con compra. Al reiniciar Java y Flowable, recuperamos la misma consulta y la confirmación de cierre. También se repitieron los recorridos con y sin compra.

Ante un fallo simulado al guardar, el formulario mantuvo los datos escritos y la ficha siguió mostrando los datos originales al abrirla desde otra sesión.

- [Ficha después del reinicio](edicion-ficha-despues-reinicio.png)
- [Listado final después del reinicio](listado-despues-reinicio.png)
- [Datos de la ficha e historial de Flowable](edicion-ficha-integracion.json)

## Bitácora de actividades

Completamos «Clasificar consulta» una vez. El historial de Flowable mostró una tarea terminada, Java guardó un evento y la ficha mostró una línea tanto en la sesión original como en otra nueva. Repetimos la revisión con copias de la bitácora anterior guardadas en el navegador y la ficha mostró una sola línea de esa tarea. Ante un fallo simulado al guardar en Java, quedó una entrada local al recargar la ficha. [Captura de la bitácora](actividad-sin-duplicados.png).

## Paquete final para Windows

Probamos una copia limpia del paquete en una carpeta con espacios. Iniciamos la interfaz en el puerto 15273, Java en 18096 y Flowable OSS 8.0.0 en 18098.

- El dashboard abrió con su hoja de estilos y la API respondió a través de la misma dirección web.
- Completamos una consulta con compra y otra sin compra, ambas del mismo contacto. El registro de cliente quedó en una sola ficha.
- Probamos dos oportunidades de recompra, una con contacto registrado y otra cerrada sin contacto. El servicio rechazó una fecha inválida con HTTP 400.
- Detuvimos el paquete y volvimos a iniciarlo con los puertos del ejemplo. Recuperamos la ficha, los dos resultados y los cuatro historiales con sus fechas de término.
- Al ocupar el puerto web con otro programa, el paquete rechazó el inicio y el otro programa siguió escuchando después de intentar iniciar y detener Peluditos. Una configuración con puertos duplicados también se rechazó.

Los recorridos de esta prueba se ejecutaron por la API del paquete. Los identificadores y cierres quedaron en [instalacion-windows-final.json](instalacion-windows-final.json). Para repetir el arranque y la comprobación manual, sigue la [guía de instalación](../../PeluditosPetChile_APP/README.md).
