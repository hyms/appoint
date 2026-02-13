# Development Backlog - Appointments 360 (v1 Deployment & Testing)

## ✅ Milestone 1 - 4: (COMPLETED)

-   [x] Base Scaffolding, Logic, and UI.
    

## ✅ Milestone 5 - 7: (COMPLETED)

-   [x] Refinement, Security Hardening, and Code Audit.
    

## ✅ Milestone 8: Testing & 80% Coverage (Quality Gate)

-   [x] **Task 8.1:** **Unit Tests:** Focus on `SlotGenerator`, `StrikeService`, and `AuthService`.
    
-   [x] **Task 8.2:** **Integration Tests:** End-to-end booking flow.
    
-   [x] **Task 8.3:** **Coverage Policy:** Configure CI/CD to block deployments if coverage < 80%.
    

## ✅ Milestone 9: Prototyping Deployment (Self-Hosted Droplet)

-   [x] **Task 9.1:** **Server Management Setup:**
    
    -   [x] Install **Portainer CE** via Docker to manage the server (Visual UI for logs, containers, and stats).
        
    -   [x] Configure **UFW (Uncomplicated Firewall)** to only allow ports 80, 443, and 9443 (Portainer).
        
-   [x] **Task 9.2:** **Backend & Frontend Dockerization:**
    
    -   [x] Configure `docker-compose.prod.yml` with log rotation (max 10MB) to save disk space.
        
    -   [x] Setup **Nginx Proxy Manager** (or Caddy) to handle SSL (HTTPS) automatically.
        
-   [x] **Task 9.3:** **Database Performance:**
    
    -   [x] Deploy PostgreSQL Alpine image or connect to Supabase Cloud.
        
    -   [x] If local: Setup a daily Cron Job for DB Backups to a remote storage (e.g., S3 or Mega).
        
-   [x] **Task 9.4:** **Automated Cleanup:**
    
    -   [x] Add a Cron Job to run `docker system prune -f` weekly to reclaim space from the 20GB disk.
        

## 🛡️ Milestone 10: Server Hardening

-   [ ] **Task 10.1:** Disable SSH password login (use SSH Keys only).
    
-   [ ] **Task 10.2:** Install **Fail2Ban** to protect against brute force on the SSH port.
    

_Status: Production deployment configuration complete. Ready for deployment!_
