# Peluditos Pet Chile

Proyecto del Grupo 05 para registrar consultas, organizar su atención y preparar contactos posteriores con los clientes.

## Integrantes y áreas de trabajo

- Juan Andrés Ramírez Gómez: análisis y modelos BPMN.
- Jorge Alberto Cerda Rodríguez: servicios web Java.
- Marcelo Daniel Valenzuela Valenzuela: Flowable e integración.

## Estado del avance al 2 de noviembre de 2026

Se adaptó el servicio a Jakarta REST mediante Jersey y se ejecutó el TO-BE en Flowable OSS 8.0.0. Se comprobaron el recorrido de cliente nuevo con compra y el de cliente existente sin compra, sin duplicar el registro. Las tareas humanas se completaron por API durante estas pruebas. La interfaz propia sigue pendiente.

Se usan bases H2 relacionales guardadas en archivos independientes para el motor y los clientes. Se comprobó que el proceso y el cliente se conservan al detener y reiniciar ambos componentes. Es una configuración local de desarrollo que el equipo puede sustituir por otra compatible, documentando y repitiendo las pruebas.

## Estructura

- `Actas`: acuerdos e historial de avances. El avance del 2 de noviembre está registrado en `Acta-2026-11-02.md`; las actas anteriores conservan su contenido histórico.
- `BPMN`: AS-IS, TO-BE ejecutable y justificación.
- `Java-Web-Services`: servicio Jakarta REST, JPA y base de clientes.
- `Flowable/Entrega-2`: arranque local y worker que invoca Java.
- `Pruebas/Entrega-1`: evidencias históricas de la primera entrega.
- `Pruebas/Entrega-2`: pruebas actuales, respuestas reales del motor y del servicio.
- `Arquitectura`: diagrama de la solución y estado de sus componentes.
- `Proyecto-2`: alcance, instrucciones y pendientes de la segunda entrega.
- `Videos`: referencias a las presentaciones; los enlaces aún deben incorporarse.

## Cómo ejecutar

Requiere Java 21, PowerShell y el WAR de Flowable OSS 8.0.0 que se distribuye en el ZIP indicado por el profesor. No se necesita la versión trial de Enterprise para estas pruebas OSS.

1. Compilar desde `Java-Web-Services` con `.\mvnw.cmd clean verify` en Windows o `./mvnw clean verify` en Linux. Configurar `JAVA_HOME` con el JDK 21 si Maven no lo detecta.
2. Desde la raíz del repo, ejecutar en PowerShell:

```powershell
.\Flowable\Entrega-2\iniciar-local.ps1 -FlowableWar "C:\ruta\flowable-8.0.0\wars\flowable-rest.war"
```

3. Para repetir la prueba integrada con Python 3, sin paquetes adicionales:

```powershell
python .\Pruebas\Entrega-2\verificar-integracion.py --war "C:\ruta\flowable-8.0.0\wars\flowable-rest.war"
```

Ese comando comprueba los endpoints, despliega el modelo, inicia instancias por mensaje, ejecuta el worker, reinicia los componentes y guarda los resultados. Usa datos ficticios; reemplaza los archivos de resultados de esta prueba. Las capturas guardadas corresponden a la ejecución identificada en ellas.

La consola REST incluida en Flowable está en `http://127.0.0.1:8098/flowable-rest/docs/`. El servicio Jakarta responde en `http://127.0.0.1:8096/api/leads`. La configuración privada, las bases y los logs de arranque se crean en `.local` y no se suben a GitHub.

## Pendientes para la Entrega 2

Conectar la interfaz propia del equipo, revisar los formularios y la experiencia de uso, acordar el almacenamiento definitivo, preparar ambos videos e incorporar sus enlaces. El equipo debe registrar las reuniones reales de cada semana. Esta actualización técnica no sustituye esas reuniones ni da por terminada toda la entrega.
