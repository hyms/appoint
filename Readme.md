# Appoint

Sistema de gestión de citas presenciales con validación de identidad y control de penalizaciones.

## 1. Arquitectura del Proyecto

El proyecto utiliza una arquitectura dockerizada basada en **Clean Code** y **S.O.L.I.D.**.

-   **Frontend:** Vue 3 + Vuetify + Vite + Pinia + Vue-i18n.

-   **Backend:** Node.js (NestJS) + Prisma ORM.

-   **Database:** PostgreSQL (vía Supabase o Docker local).


## 2. Estándares de Codificación (Coding Standards)

-   **Language:** Todo el código fuente (variables, funciones, clases, tablas, comentarios) debe escribirse exclusivamente en **Inglés**.

-   **Clean Code:** Funciones de responsabilidad única, nombres descriptivos y arquitectura desacoplada.

-   **UI/UX:** Todos los textos visibles para el usuario (Labels, Placeholders, Mensajes) deben gestionarse a través de diccionarios de **i18n**. El idioma por defecto será `es` (Español).


## 3. Estructura de Directorios

### Backend (NestJS)

```
backend/
├── src/
│   ├── common/             # Decorators, exception filters, global pipes
│   ├── config/             # Environment variables and constants
│   ├── modules/            # Domain-driven modules
│   │   ├── appointments/   
│   │   ├── auth/           
│   │   ├── users/          
│   │   └── notifications/  
│   ├── shared/             # Shared services (Prisma, Redis)
│   └── main.ts             
```

### Frontend (Vue 3)

```
frontend/
├── src/
│   ├── api/                # Axios communication services
│   ├── i18n/               # Localization dictionaries (es.json, en.json)
│   ├── components/         # Atomic and shared components
│   ├── layouts/            # Design layouts (Admin, Patient, Auth)
│   ├── store/              # Global state (Pinia)
│   ├── views/              # Main pages
│   └── main.ts             
```

## 4. Instrucciones de Levantamiento (Dev)

```
docker-compose -f docker-compose.dev.yml up --build
```

## 5. Roadmap - MVP2 Features (Planned)

Las siguientes funcionalidades están planificadas para ser implementadas en el MVP2:

- **Botón de Pánico / Cancelación Masiva:** Funcionalidad para gestionar emergencias y cancelación masiva de citas del día.
- **Sistema de Strikes:** Control automatizado de no-shows y bloqueo de pacientes por acumulación de inasistencias.
- **Paginación en tablas de Admin:** Implementación de paginación servidor para optimizar la carga de grandes volúmenes de datos en las tablas de administración.
- **Filtro por isActive en Admin Users:** Implementar filtro para buscar usuarios activos/inactivos.
