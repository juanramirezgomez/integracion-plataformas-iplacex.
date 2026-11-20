# Peluditos Pet Chile — Plataforma de Gestión de Leads y Flujos BPMN

Aplicación portátil para la gestión comercial de leads, cotizaciones y oportunidades de recompra de **Peluditos Pet Chile**, impulsada por **Flowable BPMN 8.0.0**, **Spring Boot / Jakarta REST (Java 21)** y **PowerShell External Workers**.

---

## Requisitos del Sistema

* **Sistema Operativo:** Windows 10 o Windows 11 (64 bits).
* **Dependencias externas:** **Ninguna.** El paquete incluye su propio entorno de ejecución Java (`JRE` 21 portátil), bases de datos embebidas H2 y servidor web local. No requiere instalar Java, Node.js ni motores de base de datos adicionales.
* **Puertos locales requeridos:** `5173` (Interfaz Web), `8096` (Backend API) y `8098` (Motor Flowable).

---

## Estructura del Paquete

```text
PeluditosPetChile_APP/
├── BPMN/                                      # Modelos de procesos (TO-BE y Oportunidades de Recompra)
├── External-Workers/                          # Worker automatizado en PowerShell para tareas externas
├── Interfaz/                                  # Aplicación web frontend (HTML/CSS/JS)
├── JRE/                                       # Entorno de ejecución Java 21 portátil
├── application.properties                     # Configuración base del backend Spring Boot
├── arrancar.ps1                               # Orquestador de arranque y despliegue automático
├── Detener_Peluditos.bat                      # Script de apagado limpio de servicios
├── flowable-rest.war                          # Motor de procesos Flowable 8.0.0
├── gestion-leads-backend-0.0.1-SNAPSHOT.jar   # Servicio backend Jakarta REST / Spring Boot
└── Iniciar_Peluditos.bat                      # Ejecutable principal de inicio
```

---

## Instrucciones de Uso

### 1. Iniciar el Sistema
1. Ubique la carpeta `PeluditosPetChile_APP` en cualquier directorio local de su equipo.
2. Haga doble clic sobre **`Iniciar_Peluditos.bat`**.
3. Espere unos segundos mientras el asistente realiza automáticamente los 4 pasos de inicialización:
   * **`[1/4]`** Genera credenciales seguras y bases de datos locales en la carpeta oculta `.local/`.
   * **`[2/4]`** Inicia el motor **Flowable** (puerto `8098`) y el **Backend Java** (puerto `8096`).
   * **`[3/4]`** Despliega los diagramas BPMN (`TO-BE.bpmn` y `Oportunidades-Recompra.bpmn`).
   * **`[4/4]`** Inicia el **External Worker** en segundo plano y abre la interfaz web en **`http://localhost:5173`**.

> **Nota:** En la primera ejecución, el proceso de inicialización de las bases de datos H2 puede tomar entre 15 y 30 segundos. No cierre la ventana de comandos hasta que finalice el despliegue.

### 2. Operar la Plataforma
* Al abrir la interfaz en **`http://localhost:5173`**, podrá registrar nuevos leads, gestionar estados comerciales, generar cotizaciones y ejecutar flujos de recompra.
* Mantenga abierta la ventana minimizada de PowerShell (`Windows PowerShell 5.1`), ya que corresponde al **External Worker** encargado de procesar las tareas automáticas del flujo BPMN.

### 3. Detener el Sistema
1. Al finalizar su sesión, haga clic derecho sobre **`Detener_Peluditos.bat`** y pulse "Ejecutar como administrador".
2. Este script detendrá de forma limpia el motor Flowable, el backend Java, el worker de PowerShell y el servidor web local, liberando todos los recursos y puertos del sistema.

---

## Solución de Problemas Frecuentes

* **El navegador no carga la aplicación:** Verifique que ninguno de los puertos `5173`, `8096` u `8098` esté siendo ocupado por otra aplicación antes de ejecutar `Iniciar_Peluditos.bat`.
* **Restablecer datos de fábrica:** Si desea limpiar todos los registros y reiniciar las bases de datos a su estado original, ejecute `Detener_Peluditos.bat`, elimine la carpeta `.local` y ejecute nuevamente `Iniciar_Peluditos.bat`.
* **Diagnóstico de errores:** Si algún servicio falla durante el arranque, puede consultar los detalles técnicos en los archivos `.local/motor-err.log` y `.local/java-err.log`.