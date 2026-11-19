# ACTA DE PRUEBAS Y VALIDACIÓN DE INTEGRACIÓN

**Proyecto:** Peluditos Pet Chile  
**Asignatura:** Integración de Plataformas  
**Grupo:** 05  
**Entrega:** N.º 3  
**Fecha de ejecución:** 19 de noviembre de 2026  
**Ambiente:** Desarrollo local

## 1. Objetivo

Documentar las pruebas de integración realizadas entre los procesos BPMN, Flowable, External Workers, servicios Java REST y persistencia de información comercial.

## 2. Componentes evaluados

- Interfaz web para gestión de consultas.
- Flowable como motor de procesos BPMN.
- External Workers desarrollados en PowerShell.
- Servicios Java REST con Spring Boot.
- Base de datos H2 para persistencia local.

## 3. Registro de pruebas

### EVID-01 — Finalización del BPMN principal

**Objetivo:** Verificar la ejecución completa del proceso de consultas y prospectos.

**Resultado:** La instancia finalizó correctamente.

**Proceso:** `peluditosPetChileTOBEGrupo5`

**Instancia:** `8c2f43a2-e445-11f1-bb26-088fc3d89820`

**Estado:** CONFORME.

[Ver evidencia](EVID-01-Cierre-BPMN-Principal.png)

### EVID-02 — Ejecución de External Workers

**Objetivo:** Verificar la finalización de las tareas externas del proceso principal.

**Actividades verificadas:**
- Verificar cliente existente.
- Crear registro cliente.
- Registrar compra.

**Resultado:** Las tres actividades registran inicio y término en el historial de Flowable.

**Estado:** CONFORME.

[Ver evidencia](EVID-02-External-Workers-Flowable.png)

### EVID-03 — Persistencia mediante Java REST

**Objetivo:** Comprobar que los registros comerciales puedan consultarse mediante los servicios Java.

**Endpoint:** `GET /api/leads`

**Resultado:** Se verificó el registro ID `9`, con estado `CONVERTIDO`.

**Estado:** CONFORME.

[Ver evidencia](EVID-03-Registro-Java-REST.png)

### EVID-04 — Finalización del BPMN de recompra

**Objetivo:** Comprobar el funcionamiento independiente del proceso de oportunidades de recompra.

**Proceso:** `peluditosOportunidadesRecompra`

**Instancia:** `b7843204-e44b-11f1-bb26-088fc3d89820`

**Resultado:** La instancia finalizó correctamente después de completar las tareas humanas.

**Estado:** CONFORME.

[Ver evidencia](EVID-04-Cierre-BPMN-Recompra.png)

### EVID-05 — Despliegue de procesos BPMN

**Objetivo:** Verificar que ambos procesos estén desplegados en Flowable.

**Procesos verificados:**
- `peluditosPetChileTOBEGrupo5`
- `peluditosOportunidadesRecompra`

**Resultado:** Ambas definiciones se encuentran desplegadas.

**Estado:** CONFORME.

[Ver evidencia](EVID-05-Procesos-BPMN-Desplegados.png)

## 4. Resumen de resultados

| Código | Prueba | Resultado |
|---|---|---|
| EVID-01 | Finalización BPMN principal | CONFORME |
| EVID-02 | External Workers | CONFORME |
| EVID-03 | Registro Java REST | CONFORME |
| EVID-04 | Finalización BPMN recompra | CONFORME |
| EVID-05 | Despliegue BPMN | CONFORME |

**Total: 5 verificaciones conformes.**

## 5. Limitaciones

Las pruebas fueron realizadas en un ambiente local de desarrollo.

Las evidencias no acreditan por sí solas la entrega efectiva de correos electrónicos, la detección automática de campañas, la correlación de mensajes para iniciar recompra, la concurrencia multiusuario ni el funcionamiento en producción.

## 6. Conclusión

Las pruebas realizadas respaldan el funcionamiento de los procesos BPMN, la finalización de tareas externas y la consulta de registros comerciales mediante Java REST.

Se verificó la finalización del proceso principal y del proceso independiente de recompra, junto con la disponibilidad de ambas definiciones en Flowable.

Por lo tanto, las cinco verificaciones documentadas se consideran **CONFORMES**, dentro del alcance de las pruebas realizadas.

Este documento respalda las evidencias técnicas correspondientes a la Entrega N.º 3 del proyecto Peluditos Pet Chile.
