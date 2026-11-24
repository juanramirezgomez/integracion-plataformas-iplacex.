# Guía de uso de Peluditos Pet Chile

Abre Peluditos con **Iniciar_Peluditos.bat**. En el navegador aparecerá el resumen. Desde el menú puedes registrar consultas, revisar clientes, atender tareas y crear oportunidades de recompra. Si el navegador se cerró, vuelve a la dirección que muestra el iniciador. [Instalación en Windows](../PeluditosPetChile_APP/README.md)

## Registrar y atender una consulta

1. En **Nueva consulta**, completa nombre, teléfono, correo, canal de origen y lo que pidió la persona. Pulsa **Registrar consulta** y espera el mensaje de confirmación.
2. En **Tareas BPMN**, pulsa **Actualizar tareas** si hace falta. Busca la consulta y pulsa **Gestionar**. Completa la clasificación, anota el responsable y registra la respuesta que diste.
3. En **Indicar si hubo compra**, elige **Sí** o **No**. Si eliges **No**, sigue las tareas para programar y registrar el resultado del seguimiento.
4. En **Clientes**, puedes actualizar el listado, ver si la consulta está pendiente o si el resultado fue **Compró** o **No compró**. Pulsa **Ver detalle** para revisar la ficha, editar los datos de contacto o consultar la actividad.

En esta versión la fecha de seguimiento se guarda como referencia. El temporizador de la demostración habilita la tarea siguiente después de unos segundos.

## Registrar una recompra

1. En **Recompra**, selecciona un cliente con una compra registrada. Anota el motivo y la fecha y pulsa **Crear oportunidad**.
2. En **Tareas BPMN**, abre **Revisar oportunidad**. Si corresponde contactarlo, registra el canal y después el resultado. Si eliges **No**, la oportunidad cierra sin contacto.

La oportunidad se crea desde la pantalla. La fecha se guarda como referencia. Para escribirle al cliente, usa el canal elegido. El envío desde la ficha requiere una cuenta de correo configurada en la instalación.

## Qué revisar si algo falla

- Si aparece un campo inválido, corrige el dato indicado antes de volver a enviar.
- Si la consulta se guardó y aún no aparece una tarea, espera unos segundos y pulsa **Actualizar tareas**. El worker está preparando el siguiente paso.
- Si el resumen indica que Java o Flowable no están disponibles, revisa el inicio del paquete. La [guía de instalación](../PeluditosPetChile_APP/README.md#datos-apagado-y-recuperación) indica dónde consultar el error.
