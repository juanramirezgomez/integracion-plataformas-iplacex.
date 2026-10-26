# Peluditos Pet Chile — Backend de Gestión de Leads 🐾

Este repositorio contiene la implementación del servicio web backend desarrollado en **Java** y **Spring Boot** para la solución del **Problema 1: Gestión de Leads (Potenciales Clientes)** del emprendimiento *Peluditos Pet Chile*.

El objetivo principal de esta API REST es registrar, consultar y actualizar el estado de las interacciones con clientes que contactan al emprendimiento desde redes sociales (Instagram, WhatsApp, TikTok, etc.), permitiendo el seguimiento de su ciclo de vida y la integración con flujos BPMN en **Flowable** y el **Dashboard** de gestión.

---

## 🛠️ Tecnologías Utilizadas

* **Lenguaje:** Java 21 (LTS)
* **Framework:** Spring Boot 4.1.2
* **Gestión de Dependencias:** Apache Maven
* **Capa de Persistencia:** Spring Data JPA / Hibernate
* **Base de Datos:** H2 Database (en memoria para desarrollo y pruebas rápidas)
* **Herramienta de Pruebas API:** Postman

---

## 📁 Arquitectura del Proyecto

El proyecto sigue una arquitectura por capas (*Layered Architecture*) limpia dentro del paquete base `cl.peluditospet.gestionleads`:

```text
src/main/java/cl/peluditospet/gestionleads/
├── controller/
│   └── LeadController.java       # Expone los endpoints REST (HTTP GET, POST, PUT)
├── model/
│   └── Lead.java                 # Entidad JPA que representa la tabla 'leads'
├── repository/
│   └── LeadRepository.java       # Interfaz Spring Data JPA para operaciones CRUD
└── GestionLeadsBackendApplication.java # Clase principal de arranque
```

---

## 🚀 Endpoints de la API REST

Todos los endpoints están mapeados bajo la ruta base `/api/leads` y soportan peticiones origen cruzado (`@CrossOrigin`):

| Método HTTP | Endpoint | Descripción | Body Requerido (JSON) |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/leads` | Registra un nuevo lead. Asigna estado `"NUEVO"` por defecto. | **Sí** (datos del cliente) |
| **GET** | `/api/leads` | Retorna la lista completa de leads registrados. | *Ninguno* |
| **PUT** | `/api/leads/{id}/estado` | Actualiza el estado de seguimiento del lead. | **Sí** (`{"estado": "..."}`) |

### 📝 Ejemplos de Peticiones

#### 1. Registrar un nuevo Lead (`POST /api/leads`)
**Body:**
```json
{
  "nombreCliente": "Camila Pérez",
  "correo": "camila@correo.com",
  "telefono": "+56912345678",
  "canalOrigen": "Instagram",
  "consulta": "Pastel de cumpleaños para perrito raza Poodle"
}
```

**Respuesta (`200 OK`):**
```json
{
  "id": 1,
  "nombreCliente": "Camila Pérez",
  "correo": "camila@correo.com",
  "telefono": "+56912345678",
  "canalOrigen": "Instagram",
  "consulta": "Pastel de cumpleaños para perrito raza Poodle",
  "estado": "NUEVO"
}
```

#### 2. Actualizar Estado de un Lead (`PUT /api/leads/1/estado`)
**Body:**
```json
{
  "estado": "EN_SEGUIMIENTO"
}
```

---

## ⚙️ Ejecución del Proyecto Localmente

### Prerrequisitos
* Java Development Kit (JDK) 21 instalado y configurado en la variable de entorno `JAVA_HOME`.
* Apache Maven (incluido mediante el ejecutable wrapper `./mvnw`).

### Pasos para Ejecutar
1. Clonar este repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/gestion-leads-backend.git
   cd gestion-leads-backend
   ```
2. Compilar e iniciar la aplicación desde la terminal:
   ```bash
   # En Windows
   mvnw.cmd spring-boot:run

   # En Linux/macOS
   ./mvnw spring-boot:run
   ```
3. El servidor se iniciará en el puerto `8080`:
   `http://localhost:8080/api/leads`

---

## 🗄️ Acceso a la Consola de Base de Datos H2

Para inspeccionar las tablas y registros en tiempo de ejecución:
1. Asegúrate de incluir estas propiedades en `application.properties`:
   ```properties
   spring.h2.console.enabled=true
   spring.datasource.url=jdbc:h2:mem:testdb
   ```
2. Accede en el navegador a: `http://localhost:8080/h2-console`
3. Usa la JDBC URL `jdbc:h2:mem:testdb` para conectar.

---