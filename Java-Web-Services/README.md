# Servicio Java de clientes

Aquí dejé el servicio que veníamos trabajando, ajustado a lo que pidió el profesor: los endpoints ahora usan Jakarta REST con Jersey. Mantuve la entidad `Lead`, el repositorio JPA y las operaciones que ya estaban, incluida la opción de borrar clientes.

Spring Boot 4.1.2 sigue iniciando la aplicación y Spring Data JPA se encarga de guardar los datos. Para los endpoints usé las anotaciones de `jakarta.ws.rs`, como `@GET`, `@POST` y `@Path`.

## Operaciones que probé

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/leads` | Lista los clientes. Devuelve 200. |
| POST | `/api/leads` | Registra un cliente y devuelve sus datos con el ID. Devuelve 200. |
| PUT | `/api/leads/{id}/estado` | Cambia el estado del cliente. Devuelve 200. |
| DELETE | `/api/leads/{id}` | Borra el cliente. Devuelve 204. |

Para crear un cliente dejé como obligatorios el nombre, el teléfono y la consulta. El correo y el canal de origen también se pueden guardar. Si no se indica un estado, queda como NUEVO.

Los estados que admite son NUEVO, EN_SEGUIMIENTO, COTIZADO, CONVERTIDO y DESCARTADO. Si faltan datos o el estado no es válido, responde con 400. Si el ID no existe al cambiar el estado o borrar, responde con 404. Dejé que el POST cree siempre un registro nuevo, aunque alguien envíe un ID en los datos.

## Cómo lo ejecuté

Usé Java 21. Primero compilé desde esta carpeta:

```powershell
.\mvnw.cmd clean verify
```

Después inicié el JAR:

```powershell
java -jar target/gestion-leads-backend-0.0.1-SNAPSHOT.jar
```

Así queda en `http://127.0.0.1:8096/api/leads` y guarda los datos en `datos/clientes.mv.db`, dentro de la carpeta desde la que se inicia.

Para probarlo junto con Flowable usé el script `Flowable/Entrega-2/iniciar-local.ps1`, desde la carpeta principal. Ese inicio guarda los clientes y los datos del motor en archivos separados dentro de `.local`.

## Datos que usé para el registro

```json
{"nombreCliente":"Cliente de prueba","correo":"prueba@example.invalid","telefono":"CONTACTO-DE-PRUEBA","canalOrigen":"WhatsApp","consulta":"Consulta ficticia por una torta"}
```

El canal lo anoté en el registro; eso no conecta el servicio con la cuenta de WhatsApp.

## Configuración para seguir conectando las partes

Dejé estas variables por si cambiamos la base: `BUSINESS_DB_URL`, `BUSINESS_DB_DRIVER`, `BUSINESS_DB_USER` y `BUSINESS_DB_PASSWORD`. Si usamos otro motor, también falta agregar su controlador JDBC en el POM y volver a probarlo.

Para conectar una pantalla que esté en otro puerto, dejé `FRONTEND_ORIGINS` con la lista de direcciones permitidas, separadas por comas. Por ahora acepta localhost y 127.0.0.1 en los puertos 5173 y 3000. Esta es la configuración CORS: permite que el navegador haga las peticiones desde esas direcciones.

Los resultados quedaron en `Pruebas/Entrega-2`. La prueba de arranque de Maven usa una base temporal solo para ese test; las pruebas con Flowable sí guardan los datos en archivos y comprueban el reinicio.

Para configurar Jersey me basé en la documentación de Spring Boot: https://docs.spring.io/spring-boot/reference/web/servlet.html#web.servlet.jersey
