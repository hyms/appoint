# Development Backlog - Appointments 360

This backlog is designed for AI-assisted development or engineering teams.

## Milestone 1: Project Setup & Dockerization

-   [x] **Task 1.1:** Initialize NestJS project in `/backend`. Set up TypeScript, ESLint, and Prettier. (All code/comments in English).
    
-   [x] **Task 1.2:** Initialize Vue 3 project in `/frontend` with Vuetify 3, Pinia, and **Vue-i18n**.
    
-   [x] **Task 1.3:** Create `docker-compose.dev.yml` and `Dockerfile` for both services.
    
-   [x] **Task 1.4:** Configure Prisma ORM and connect to PostgreSQL (English naming conventions for tables/fields).
    

## Milestone 2: Data Modeling & Authentication

-   [x] **Task 2.1:** Design Prisma schema (Entities: User, Profile, Appointment, Location, Slot, Strike, NotificationLog).
    
-   [x] **Task 2.2:** Implement JWT Authentication module with role-based access control (RBAC).
    
-   [x] **Task 2.3:** Create Magic Link generation service for WhatsApp identity validation.
    

## Milestone 3: Availability & Core Logic

-   [x] **Task 3.1:** Develop the dynamic slot generation engine based on professional configuration.
    
-   [x] **Task 3.2:** Implement the "Emergency Button" to disable specific workdays and trigger mass notifications.
    
-   [x] **Task 3.3:** Develop the Strike System logic and the 2-day temporary blocking mechanism.
    

## Milestone 4: User Interfaces (UI) with i18n

-   [x] **Task 4.1:** Set up `es.json` / `en.json` dictionaries and structure layouts using `$t('key')`.
    
-   [x] **Task 4.2:** Build Admin/Secretary Dashboard (Appointment management, QR validation).
    
-   [x] **Task 4.3:** Build Mobile-First Patient Booking Flow (Slot selection, Magic Link landing).
    
-   [x] **Task 4.4:** Build QR Payment upload interface and status tracker.
    

## Milestone 5: Integrations & Cron Jobs

-   [x] **Task 5.1:** Implement Notification Provider (Wrapper for WhatsApp/Telegram APIs).
    
-   [x] **Task 5.2:** Set up Cron Jobs for automated reminders (24h and 6h before appointment).
