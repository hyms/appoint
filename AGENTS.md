# 📖 AGENTS & SKILLS: Manual Maestro (Appointments 360)

Este archivo constituye la **Fuente de Verdad** del proyecto. Define las reglas operativas para los Agentes de IA y los desarrolladores humanos, combinando mandatos de comportamiento con lógica de negocio crítica.

---

## 📑 Tabla de Contenidos
1. [🛠️ Stack Técnico y Entorno](#-stack-técnico-y-entorno)
2. [🛡️ Seguridad, Auditoría y Roles](#-seguridad-auditoría-y-roles)
3. [🔔 Sistema de Alertas y PWA](#-sistema-de-alertas-y-pwa)
4. [🧠 Reglas de Negocio (Skills)](#-reglas-de-negocio-skills)
5. [📊 Analytics y Reportes](#-analytics-y-reportes)
6. [🏗️ Estándares de Código y Diseño](#-estándares-de-código-y-diseño)
7. [🗺️ Mapa del Proyecto](#-mapa-del-proyecto)

---

## 1. 🛠️ Stack Técnico y Entorno

- **Backend**: NestJS (v16+) + Prisma ORM.
- **Database**: PostgreSQL (Self-hosted via Docker).
- **Frontend**: Vue 3 (Composition API) + Vuetify 3 (Theme Custom Industrial).
- **Comunicación**: Axios (Instancia centralizada en `frontend/src/services/api.ts`).
- **Mobile/PWA**: Soporte nativo para Progressive Web App.
- **Push Notifications**: OneSignal (SDK Frontend / REST API Backend).
- **Infraestructura**: VPS con limitación de recursos (20GB Disco).

---

## 2. 🛡️ Seguridad, Auditoría y Roles

### 🔒 Protección y Brute Force
- **Anti-DoS**: Implementación obligatoria de `@nestjs/throttler` y `helmet`.
- **Bloqueo**: Suspensión automática de IP/Cuenta tras **5 intentos fallidos** detectados por el `BruteForceProtectionService`.

### 📝 Auditoría Inmutable
- **AppointmentAudit**: Es obligatorio registrar CADA cambio de estado, fecha o profesional en la tabla de auditoría. No se permiten modificaciones de citas sin un log asociado.

### 👥 Jerarquía de Visibilidad
| Rol | Alcance de Visibilidad |
| :--- | :--- |
| **Patient** | Historial personal, resúmenes de sus propias citas y pagos. |
| **Professional** | Métricas personales, pacientes asignados y su propia agenda. |
| **Secretary** | Reportes de su sucursal específica y filtros por doctores de esa sede. |
| **Admin** | Acceso total global, comparativas cross-sucursal y gestión de usuarios. |

---

## 3. 🔔 Sistema de Alertas y PWA

- **OneSignal Sync**: `OneSignal.login(userId)` debe ejecutarse inmediatamente tras el login exitoso.
- **Notificaciones Transaccionales**: Al modificar una cita (fecha/hora/estado), el sistema debe notificar por push a todos los participantes (Paciente y Profesional).
- **PWA**: El frontend debe mantener el manifiesto y service workers actualizados para permitir la instalación en dispositivos móviles.

---

## 4. 🧠 Reglas de Negocio Complejas (Skills)

### A. Gestión de Citas
- **Window of Change**: Modificaciones permitidas hasta **2 horas antes** del inicio.
- **Admin Restriction**: El Admin supervisa pero **no modifica** citas directamente para preservar la integridad de la agenda del Profesional.
- **Inmutabilidad**: Estados `CANCELLED` o `COMPLETED` bloquean cualquier edición posterior.
- **Doctor Lock**: Prohibido cambiar el profesional en una cita existente; se debe cancelar y crear una nueva.

### B. Resúmenes de Sesión (Post-Consulta)
- **Autoría**: Solo el `Professional` puede crear y firmar el resumen de la sesión.
- **Edición**: El `Professional` dispone de una ventana de **2 horas** post-creación para corregir el resumen. Tras esto, queda sellado.

### C. Sistema de Strikes
- **No-Show Control**: El sistema debe registrar `strikes` automáticamente en caso de inasistencia.
- **Bloqueo**: Al alcanzar 3 strikes activos, el paciente queda bloqueado para nuevas reservas.

---

## 5. 📊 Analytics y Reportes

El sistema debe generar reportes dinámicos con filtros de (Date Range, Status, Doctor, Branch):

1. **Ocupación de Agenda**: % de slots utilizados vs disponibles.
2. **Tasa de Ausentismo**: Reporte de strikes y efectividad de asistencia.
3. **Ingresos Estimados**: Basado en citas `COMPLETED` con QR verificado.
4. **Productividad**: Pacientes atendidos vs tiempo promedio de consulta.
5. **Log de Auditoría**: Quién, qué y cuándo en cada cambio crítico.

---

## 6. 🏗️ Estándares de Código y Diseño

### 💻 Clean Code
- **Idioma**: Código fuente (variables, clases, comentarios) **100% en Inglés**.
- **Backend**: Arquitectura modular, inyección de dependencias estricta.
- **Frontend**: Uso exclusivo de la instancia centralizada de Axios. Prohibido conexiones directas a DB.
- **i18n**: Todo texto visible en UI debe usar `$t('key')`. El idioma por defecto es **Español (es)**.

### 🎨 UI/UX (Industrial Aesthetic)
- **Tipografía**: Headers en **Syne**, Body en **Roboto**, Data/Mono en **Roboto Mono**.
- **Estética**: Bordes ligeramente redondeados (`rounded-lg`), alta densidad de información, visuales de "sistema de control".
- **Feedback**: Uso obligatorio de `IndustrialLoader` para estados de carga y centralización de alertas vía `useToast`.

---

## 7. 🗺️ Mapa del Proyecto

- `backend/src/`: Lógica de NestJS, módulos divididos por dominio.
- `frontend/src/components/base/`: Componentes atómicos e industriales.
- `frontend/src/services/`: Capa de abstracción de API (Axios).
- `frontend/src/views/`: Páginas principales (Dashboard, Admin, Booking).
- `prisma/schema.prisma`: Definición del esquema de datos (PostgreSQL).

---
*Nota: Este manual debe ser actualizado por el Agente cada vez que se implemente una nueva regla de negocio core.*
