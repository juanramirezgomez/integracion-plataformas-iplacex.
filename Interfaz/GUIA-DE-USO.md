# Guía de uso de Peluditos Pet Chile

Abre Peluditos con **Iniciar_Peluditos.bat**. En el navegador aparecerá el resumen. Desde el menú puedes registrar consultas, revisar clientes, atender tareas y crear oportunidades de recompra. Si el navegador se cerró, vuelve a la dirección que muestra el iniciador. [Instalación en Windows](../PeluditosPetChile_APP/README.md)

## Registrar y atender una consulta

1. En **Nueva consulta**, completa nombre, teléfono, correo, canal de origen y lo que pidió la persona, por ejemplo, una cotización por una torta de cumpleaños para su mascota. Pulsa **Registrar consulta** y espera el mensaje de confirmación.
2. En **Tareas BPMN**, pulsa **Actualizar tareas** si hace falta. Busca tu consulta por su descripción y pulsa **Gestionar**. Si el teléfono ya estaba registrado, primero aparece **Revisar datos del contacto**. Para un teléfono nuevo, la primera tarea después del registro automático es **Clasificar consulta**. Completa la clasificación, anota el responsable y registra la respuesta.
3. En **Indicar si hubo compra**, elige **Sí** o **No**. Si eliges **No**, abre **Programar seguimiento (fecha)** y elige una fecha y hora futuras. A partir de esa hora, pulsa **Actualizar tareas**, abre **Contactar cliente de seguimiento** y completa **Registrar resultado de seguimiento**. Ahí anotas cómo salió el contacto, por ejemplo, «Se envió la cotización y quedó en revisarla». Al completar la tarea, la consulta queda marcada como **No compró**.
4. En **Clientes**, puedes actualizar el listado, ver si la consulta está pendiente o si el resultado fue **Compró** o **No compró**. Pulsa **Ver detalle** para revisar la ficha, editar los datos de contacto o consultar la actividad.

Flowable usa la hora local del computador donde instalaste Peluditos. Si el paquete está apagado cuando se cumpla la hora, vuelve a iniciarlo para que el motor procese el seguimiento.

## Registrar una recompra

1. En **Recompra**, selecciona un cliente con una compra registrada. Anota el motivo y la fecha y pulsa **Crear oportunidad**.
2. En **Tareas BPMN**, abre **Revisar oportunidad**. Si corresponde contactarlo, registra el canal y después el resultado. Si eliges **No**, la oportunidad cierra sin contacto.

La oportunidad se crea desde la pantalla. La fecha se guarda como referencia. Para escribirle al cliente, usa el canal elegido. El envío desde la ficha requiere una cuenta de correo configurada en la instalación.

## Eliminar un cliente

En **Clientes**, abre **Ver detalle**, pulsa **Eliminar cliente** y confirma. Se borran su ficha y sus consultas, y se cancelan sus procesos pendientes. Si Flowable está caído, la ficha se conserva. Vuelve a intentar después de iniciar Flowable.

## Qué revisar si algo falla

- Si aparece un campo inválido, corrige el dato indicado antes de volver a enviar.
- Si recién registraste la consulta, espera unos segundos y pulsa **Actualizar tareas** mientras el worker prepara la primera tarea. Si ya programaste el seguimiento, la tarea de contacto se habilita a partir de la fecha y hora indicadas.
- Si el resumen indica que Java o Flowable no están disponibles, revisa el inicio del paquete. La [guía de instalación](../PeluditosPetChile_APP/README.md#datos-apagado-y-recuperación) indica dónde consultar el error.
