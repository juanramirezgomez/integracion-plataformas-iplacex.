# Servicio de consultas y clientes

El servicio conserva la entidad Lead y el repositorio JPA del equipo. Los endpoints se implementan con Jakarta REST (`jakarta.ws.rs`) mediante Jersey 4. Spring Boot 4.1.2 se utiliza para el arranque y Spring Data JPA para la persistencia; los endpoints ya no usan Spring MVC.

## Operaciones

| Método | Ruta | Resultado |
|---|---|---|
| GET | `/api/leads` | Lista los clientes, HTTP 200. |
| POST | `/api/leads` | Crea un cliente y devuelve su ID, HTTP 200. |
| PUT | `/api/leads/{id}/estado` | Cambia el estado de un cliente, HTTP 200. |
| DELETE | `/api/leads/{id}` | Elimina un cliente existente, HTTP 204. |

El POST requiere `nombreCliente`, `telefono` y `consulta`; también admite `correo` y `canalOrigen`. El estado inicial es NUEVO. Los estados admitidos son NUEVO, EN_SEGUIMIENTO, COTIZADO, CONVERTIDO y DESCARTADO. Datos incompletos o estados no admitidos producen HTTP 400. Un ID inexistente en PUT o DELETE produce HTTP 404. Un ID recibido en el POST no permite sobrescribir otro registro.

Los datos se ingresan manualmente o mediante el worker. Indicar WhatsApp o Instagram en `canalOrigen` no conecta la aplicación con esas redes.

## Ejecutar

Usar Java 21. Desde esta carpeta ejecutar `.\mvnw.cmd clean verify` y después `java -jar target/gestion-leads-backend-0.0.1-SNAPSHOT.jar`. Por defecto escucha solo en este equipo, puerto 8096, y guarda los clientes en `datos/clientes.mv.db` dentro del directorio de trabajo.

El arranque integrado desde `Flowable/Entrega-2/iniciar-local.ps1` usa bases independientes bajo `.local` en la raíz del repo. Se puede configurar la base de negocio con BUSINESS_DB_URL, BUSINESS_DB_DRIVER, BUSINESS_DB_USER y BUSINESS_DB_PASSWORD. Si se elige otro motor, también hay que agregar su controlador JDBC al POM y repetir las pruebas.

Para una pantalla alojada en otro puerto, FRONTEND_ORIGINS contiene la lista de orígenes permitidos, separados por comas. Los valores locales iniciales son localhost y 127.0.0.1 en los puertos 5173 y 3000. No se expone la consola H2 del prototipo anterior.

Ejemplo de POST:

```json
{"nombreCliente":"Cliente de prueba","correo":"prueba@example.invalid","telefono":"CONTACTO-DE-PRUEBA","canalOrigen":"WhatsApp","consulta":"Consulta ficticia por una torta"}
```

## Pruebas

La prueba de arranque del proyecto usa una base aislada en memoria exclusivamente para tests. Las comprobaciones HTTP y de persistencia reales están en `Pruebas/Entrega-2`, incluyendo lectura, registro, cambio de estado, eliminación, respuestas 400/404, CORS y los recorridos con Flowable.

La configuración de Jersey sigue la integración JAX-RS documentada por Spring Boot: https://docs.spring.io/spring-boot/reference/web/servlet.html#web.servlet.jersey
