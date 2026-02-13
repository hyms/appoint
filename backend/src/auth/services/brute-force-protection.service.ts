import { Injectable, Logger } from '@nestjs/common';

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

@Injectable()
export class BruteForceProtectionService {
  private readonly logger = new Logger(BruteForceProtectionService.name);
  private readonly attempts = new Map<string, LoginAttempt>();
  
  // Configurable limits
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Check if IP is blocked from logging in
   */
  isBlocked(identifier: string): boolean {
    const attempt = this.attempts.get(identifier);
    
    if (!attempt) return false;
    
    // Check if block has expired
    if (attempt.blockedUntil && Date.now() > attempt.blockedUntil) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return !!attempt.blockedUntil;
  }

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const existing = this.attempts.get(identifier);

    if (!existing) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
      });
      this.logger.warn(`First failed login attempt for ${identifier}`);
      return;
    }

    // Reset if window has passed
    if (now - existing.firstAttempt > this.WINDOW_MS) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
      });
      return;
    }

    existing.count++;

    // Block if max attempts reached
    if (existing.count >= this.MAX_ATTEMPTS) {
      existing.blockedUntil = now + this.BLOCK_DURATION_MS;
      this.logger.error(
        `IP ${identifier} blocked for ${this.BLOCK_DURATION_MS / 60000} minutes after ${existing.count} failed attempts`
      );
    }
  }

  /**
   * Clear attempts on successful login
   */
  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining attempts before block
   */
  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return this.MAX_ATTEMPTS;
    
    const remaining = this.MAX_ATTEMPTS - attempt.count;
    return Math.max(0, remaining);
  }

  /**
   * Get block time remaining in seconds
   */
  getBlockTimeRemaining(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt?.blockedUntil) return 0;
    
    const remaining = attempt.blockedUntil - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }
}
