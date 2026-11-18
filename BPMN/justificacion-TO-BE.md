# Procesos propuestos de Peluditos Pet Chile

## Consultas y prospectos

El [proceso de consultas](TO-BE.bpmn) ([diagrama](TO-BE.png)) empieza cuando la pantalla envía una consulta. El worker busca el contacto en Java y crea un registro si todavía no existe. Un prospecto es alguien que consultó o cotizó. Si hace una compra, el worker registra el cambio a cliente en Java y Flowable cierra la consulta. Si todavía no compra, se programa el seguimiento y el worker guarda el resultado de la consulta al cerrar ese recorrido.

Las tareas y variables que usa la pantalla conservan sus identificadores. La decisión de compra usa `compraRealizada`. El worker devuelve `clienteRegistrado` con el resultado de la búsqueda.

Cada consulta guarda su nombre, teléfono, correo, canal, descripción y resultado en Java. El resultado de una consulta se guarda aparte del estado del contacto, para conservar compras anteriores cuando esa persona vuelva a cotizar.

## Oportunidades de recompra

El [proceso de recompra](Oportunidades-Recompra.bpmn) ([diagrama](Oportunidades-Recompra.png)) empieza con el mensaje `OportunidadComercialDetectada`. Puede originarse por el cumpleaños de una mascota, una campaña u otra fecha relevante. La instancia recibe el identificador de un cliente con compra previa (`clienteId`), el `motivo` y la `fechaOportunidad`. El cliente puede proceder de un registro previo del negocio.

La encargada revisa la oportunidad y decide si corresponde contactar (`contactarCliente`). Si responde que sí, registra el contacto y su resultado. Si responde que no, se cierra la oportunidad.

El mensaje se envía manualmente por API en la [prueba del modelo](../Pruebas/Recorridos/resultados-recompra.json). Queda por conectar la detección de fechas y campañas, la selección automática de clientes y la pantalla de recompra al servicio definitivo.
