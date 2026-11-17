# Pruebas del servicio Java

Fecha: 26/10/2026.

## Comprobaciones realizadas

- Se instaló Java 21 para trabajar con la misma versión que requiere el servicio del equipo.
- Se compiló el proyecto Java sin modificar su código ni su pom.xml. La compilación y la prueba de arranque terminaron correctamente.
- Se inició el servicio en el puerto 8096, solo para pruebas locales.
- Se registró una consulta ficticia: el servicio devolvió un identificador y el estado NUEVO.
- Se consultó el listado y se comprobó que el registro aparecía.
- Se cambió el estado a EN_SEGUIMIENTO y se volvió a consultar para confirmar el cambio.

## Evidencias

- `resultado-servicio-java.json`: respuestas de las pruebas de registro, consulta y actualización.
- `consulta-en-seguimiento.png`: captura real del navegador mostrando el registro de prueba.
- `probar-servicio.ps1`: permite repetir las llamadas. Cada ejecución agrega una consulta ficticia.

## Repetir en Windows

1. Tener JDK 21 configurado en JAVA_HOME y Maven disponible mediante el wrapper del proyecto o una instalación propia.
2. Desde Java-Web-Services ejecutar `mvnw.cmd clean package` (o `mvn clean package`).
3. Desde esta carpeta ejecutar en PowerShell `./iniciar-servicio.ps1`. Mantener abierta esa consola.
4. En otra consola ejecutar `./probar-servicio.ps1`.
5. Abrir `http://127.0.0.1:8096/api/leads` para consultar los registros.

El servicio usa la base H2 en memoria configurada por el equipo. Los registros de prueba desaparecen al detenerlo.

## Lo que falta probar

Flowable Cloud mostró un aviso de mantenimiento durante el intento de acceso. Quedan pendientes los formularios, el worker y la ejecución integrada del proceso en Flowable Enterprise. Estas pruebas locales solo demuestran que el servicio Java responde.
