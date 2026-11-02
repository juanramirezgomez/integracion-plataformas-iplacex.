# Peluditos Pet Chile

Proyecto del Grupo 05 para registrar las consultas de los clientes y llevar su seguimiento.

## Integrantes

- Juan Andrés Ramírez Gómez: análisis y modelos BPMN.
- Jorge Alberto Cerda Rodríguez: servicios web Java.
- Marcelo Daniel Valenzuela Valenzuela: Flowable e integración.

## Avance del 2 de noviembre

Hola compañeros, les dejo actualizado lo que pude avanzar y comprobar en local con Flowable 8.

Ajusté el servicio para que use Jakarta REST con Jersey, siguiendo lo que comentó el profe. Mantuve las operaciones que ya tenía, incluida la opción de borrar clientes. Después lo conecté con el worker y probé el TO-BE en Flowable OSS 8.0.0.

Pude completar el recorrido de un cliente nuevo que compra y el de un cliente existente que no compra, sin duplicar su registro. Para estas pruebas completé las tareas por API; todavía falta conectar nuestra pantalla.

Por ahora usé H2 guardando los datos en archivos separados: uno para Flowable y otro para los clientes. Apagué y volví a iniciar los dos servicios para comprobar que los datos siguieran ahí, y el proceso pudo continuar. Nos falta definir qué base de datos vamos a usar.

## Dónde dejé las cosas

- `Actas`: dejé el avance de hoy en `Acta-2026-11-02.md` y conservé las actas anteriores.
- `BPMN`: están el AS-IS, el TO-BE ejecutable y la explicación de los cambios.
- `Java-Web-Services`: está el servicio Java actualizado a Jakarta REST.
- `Flowable/Entrega-2`: dejé el inicio del entorno local y el worker.
- `Pruebas/Entrega-1`: siguen las pruebas de la primera entrega.
- `Pruebas/Entrega-2`: dejé los resultados y el script para repetir las pruebas de ahora.
- `Arquitectura`: actualicé el dibujo con lo que está funcionando y lo que falta conectar.
- `Proyecto-2`: dejé explicado el avance y lo pendiente de esta entrega.
- `Videos`: falta agregar los enlaces a las presentaciones.

## Cómo ejecutar

Hola chicos, para ejecutar esta prueba usé Java 21, PowerShell y el archivo `flowable-rest.war` de Flowable OSS 8.0.0, que fue el que mandó el profesor. No descargué la versión trial de Enterprise para esta prueba. También usé Python 3 para ejecutar el script de pruebas. Les dejo los pasos que seguí.

Lo primero que hice fue compilar el servicio desde la carpeta `Java-Web-Services` con este comando:

```powershell
.\mvnw.cmd clean verify
```

Para que Maven usara Java 21, dejé `JAVA_HOME` apuntando al JDK 21. Después volví a la carpeta principal del repo e inicié Flowable y Java con este comando:

```powershell
.\Flowable\Entrega-2\iniciar-local.ps1 -FlowableWar "C:\ruta\flowable-8.0.0\wars\flowable-rest.war"
```

Donde dice `C:\ruta\...` va la ubicación del archivo WAR en el computador de cada uno.

Con los dos servicios iniciados, corrí esta prueba desde la carpeta principal:

```powershell
python .\Pruebas\Entrega-2\verificar-integracion.py --war "C:\ruta\flowable-8.0.0\wars\flowable-rest.war"
```

La prueba usa datos ficticios, carga el TO-BE, ejecuta el worker y recorre los dos casos. Al incluir `--war`, también reinicia Flowable y Java para comprobar que los datos se conserven. Los resultados quedan en `Pruebas/Entrega-2`; si la vuelven a ejecutar, esos archivos se actualizan con la prueba nueva.

La consola REST que viene con Flowable queda en `http://127.0.0.1:8098/flowable-rest/docs/` y el listado de clientes en `http://127.0.0.1:8096/api/leads`.

Los archivos de configuración local y las bases quedan en `.local`. Esa carpeta está excluida del repo para no subir las contraseñas ni los datos de cada computador.

## Lo que nos falta para la Entrega 2

- Conectar nuestra pantalla con Flowable y el servicio Java.
- Probar los formularios y el recorrido desde esa pantalla.
- Definir qué base de datos vamos a usar.
- Grabar los dos videos y agregar los enlaces al repo.
