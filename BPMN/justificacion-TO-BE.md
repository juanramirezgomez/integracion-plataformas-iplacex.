# Procesos propuestos de Peluditos Pet Chile

## Consultas y prospectos

El [proceso de consultas](TO-BE.bpmn) ([diagrama](TO-BE.png)) empieza cuando la pantalla envía una consulta. El worker busca el contacto en Java y crea un registro si todavía no existe. Un prospecto es alguien que consultó o cotizó. Si hace una compra, el worker registra el cambio a cliente en Java y Flowable cierra la consulta. Si todavía no compra, se programa el seguimiento y el worker guarda el resultado de la consulta al cerrar ese recorrido.

Las tareas y variables que usa la pantalla conservan sus identificadores. La decisión de compra usa `compraRealizada`. El worker devuelve `clienteRegistrado` con el resultado de la búsqueda.

Cada consulta guarda su nombre, teléfono, correo, canal, descripción y resultado en Java. El resultado de una consulta se guarda aparte del estado del contacto, para conservar compras anteriores cuando esa persona vuelva a cotizar.

## Oportunidades de recompra

El [proceso de recompra](Oportunidades-Recompra.bpmn) ([diagrama](Oportunidades-Recompra.png)) empieza cuando la encargada abre **Recompra** en el dashboard, selecciona un cliente con compra previa e ingresa el motivo y la fecha. El servicio Java envía a Flowable el mensaje `OportunidadComercialDetectada` con `clienteId`, `motivo` y `fechaOportunidad`.

La encargada revisa la oportunidad y decide si corresponde contactar (`contactarCliente`). Si responde que sí, registra el contacto y su resultado. Si responde que no, se cierra la oportunidad.

La detección automática de fechas y campañas y la selección automática de clientes quedan fuera de esta versión. Probamos desde el dashboard las dos salidas del proceso, con contacto y sin contacto. También dejamos la prueba directa por API. [Prueba en el dashboard](../Pruebas/Recorridos/README.md#recompra-desde-la-pantalla) · [Prueba del modelo por API](../Pruebas/Recorridos/resultados-recompra.json).
