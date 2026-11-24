# Arquitectura de Peluditos Pet Chile

```mermaid
flowchart LR
    U["Responsable del emprendimiento"] -->|Navegador| B
    subgraph PC["Computador de destino con Windows"]
        B["Dashboard y servidor web local"] -->|Proxy /api| J["Java 21 · Jakarta REST"]
        J -->|Instancias y tareas humanas| F["Flowable OSS 8.0.0"]
        W["External worker · PowerShell"] -->|Toma tareas y devuelve resultados| F
        W -->|Consulta y actualiza clientes| J
        F --> M[("H2 · datos del motor")]
        J --> D[("H2 · datos de negocio")]
        C[".local/instalacion.json"] -. Puertos .-> B
        C -. Puertos .-> J
        C -. Puertos .-> F
    end
```

El destino definido es un computador Windows de 64 bits. El navegador abre el servidor web local, que entrega el dashboard y reenvía las llamadas a Java. Java inicia los BPMN y gestiona las tareas humanas con Flowable. El worker toma las tareas externas, consulta o actualiza el contacto en Java y devuelve el resultado a Flowable.

## Configuración y almacenamiento

| Componente | Puerto de ejemplo | Datos o configuración |
| --- | ---: | --- |
| Dashboard | 5173 | El navegador usa la ruta /api del servidor web. |
| Java 21 | 8096 | H2, contactos y consultas en .local/datos-negocio/clientes.mv.db. |
| Flowable OSS 8.0.0 | 8098 | H2, instancias y tareas en .local/datos-motor/flowable.mv.db. |
| Worker | | Se conecta a Java y Flowable con las direcciones de la instalación. |

Los tres puertos se definen en un solo archivo de configuración. El paquete genera las credenciales en la carpeta privada de la instalación. Para reinstalar o respaldar, sigue la [guía de Windows](../PeluditosPetChile_APP/README.md). La [fuente editable del diagrama](modelo-arquitectura.mmd) está en esta carpeta.
