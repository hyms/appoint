# Development Backlog - Appointments 360 (v1 Stabilization)

This backlog focuses on refining the MVP 1 to ensure it is production-ready before moving to intelligent features.

## ✅ Milestone 1: Environment & Project Scaffolding (COMPLETED)

-   \[x\] **Task 1.1:** NestJS /backend initialization.
    
-   \[x\] **Task 1.2:** Vue 3 /frontend with Vuetify 3 & i18n.
    
-   \[x\] **Task 1.3:** Docker Compose setup (Dev/Prod).
    
-   \[x\] **Task 1.4:** Prisma ORM & PostgreSQL connection.
    

## ✅ Milestone 2: Core Data Modeling & Security (COMPLETED)

-   \[x\] **Task 2.1:** Prisma Schema migration (Users, Appointments, Locations).
    
-   \[x\] **Task 2.2:** JWT Auth & RBAC implementation.
    
-   \[x\] **Task 2.3:** Magic Link validation for WhatsApp.
    

## ✅ Milestone 3: Availability Engine & Business Logic (COMPLETED)

-   \[x\] **Task 3.1:** Slot Generator engine.
    
-   \[x\] **Task 3.2:** Emergency Kill Switch & mass notifications.
    
-   \[x\] **Task 3.3:** Strike System & 2-day auto-blocking.
    

## ✅ Milestone 4: Frontend Development (COMPLETED)

-   \[x\] **Task 4.1:** i18n configuration (es/en).
    
-   \[x\] **Task 4.2:** Admin/Secretary Dashboard.
    
-   \[x\] **Task 4.3:** Mobile-First Booking Flow.
    

## 🛠️ Milestone 5: V1 Refinement & Stabilization (CURRENT)

-   \[ \] **Task 5.1:** **Secretary Call Protocol:** Update `AppointmentStatus` to include `VOICE_VERIFIED`. Add a "Call & Verify" button in the Secretary Dashboard.
    
-   \[ \] **Task 5.2:** **Strict Overbooking Limit:** Backend interceptor to enforce "Max 2 Overbooks per day" and UI warnings.
    
-   \[ \] **Task 5.3:** **Manual QR Flow Audit:** Improve image preview and add "Reject with Reason" flow for payments.
    
-   \[ \] **Task 5.4:** **Emergency Kill Switch Polish:** Implement BullMQ or similar for reliable mass messaging.
    

## 🛡️ Milestone 6: Hardened Authentication & Anti-DoS

-   \[ \] **Task 6.1:** **Login Brute Force Protection:** - Implement a cooldown mechanism after 5 failed login attempts (e.g., block user/IP for 15 minutes).
    
    -   Store failed attempts in Redis for high-performance tracking.
        
-   \[ \] **Task 6.2:** **API Rate Limiting:** - Configure `@nestjs/throttler` to limit requests per IP across all sensitive endpoints (`/auth/login`, `/auth/magic-link`).
    
-   \[ \] **Task 6.3:** **Account Lockout Notifications:** - Notify the user via WhatsApp/Email if their account has been temporarily locked due to multiple failed attempts.
    
-   \[ \] **Task 6.4:** **Advanced Security Headers:** - Configure `helmet` and CORS policies to prevent common web vulnerabilities (XSS, Clickjacking).
    

## 📅 Roadmap (Future Versions)

-   **v1.1:** Gemini 2.0 Flash Integration for Natural Language Booking.
    
-   **v2.0:** Automatic Payment Gateway & E-Invoicing.
    

_Status: Hardening security and refining MVP 1._
