# Arquitectura de la solución

El dibujo representa lo implementado y lo que aún falta conectar. La interfaz propia aparece con borde discontinuo porque sigue pendiente.

```mermaid
flowchart LR
    U[Responsable del emprendimiento] -. pendiente .-> UI[Interfaz web propia]
    UI -. REST pendiente .-> F[Flowable OSS 8.0.0]
    UI -. REST pendiente .-> J[Servicio Java Jakarta REST - Jersey]
    T[Prueba técnica por API] -->|Inicia mensaje y completa tareas| F
    W[External worker PowerShell] -->|Adquiere trabajos y devuelve variables| F
    W -->|GET POST PUT| J
    F --> M[(H2 en archivo - motor)]
    J --> D[(H2 en archivo - negocio)]
    classDef pendiente stroke-dasharray:5 5,fill:#fff4db,stroke:#9e721c
    class UI pendiente
```

## Comunicaciones comprobadas

Flowable coordina el proceso. El worker adquiere sus trabajos externos, invoca las operaciones Jakarta y devuelve variables que permiten seguir el flujo. El servicio usa JPA para leer y escribir los clientes. El motor mantiene por separado instancias, tareas, variables e historial.

El responsable se asigna a las tareas de usuario. Durante la prueba técnica se completaron por API. Este mecanismo de prueba no sustituye la interfaz propia de la aplicación.

## Despliegue local

| Componente | Dirección o ubicación |
|---|---|
| Flowable OSS | 127.0.0.1:8098/flowable-rest |
| Servicio Jakarta | 127.0.0.1:8096/api/leads |
| Worker | Proceso local PowerShell, sin puerto de entrada |
| Base del motor | .local/datos-motor/flowable.mv.db |
| Base de negocio | .local/datos-negocio/clientes.mv.db |

El arranque integrado usa dos bases relacionales H2 persistentes. El grupo puede optar por PostgreSQL, MySQL u otra alternativa compatible y volver a verificar el almacenamiento. Las contraseñas se generan por entorno y quedan en archivos locales excluidos del repo.

No hay integración con APIs de WhatsApp o Instagram. Esos nombres identifican el canal de origen que se registra en la consulta. No se publicaron los servicios en Internet.
