import { BruteForceProtectionService } from './brute-force-protection.service';

describe('BruteForceProtectionService', () => {
  let service: BruteForceProtectionService;

  beforeEach(() => {
    service = new BruteForceProtectionService();
  });

  describe('isBlocked', () => {
    it('should return false when no attempts recorded', () => {
      expect(service.isBlocked('test-ip')).toBe(false);
    });

    it('should return false when blocked time has expired', () => {
      service.recordFailedAttempt('test-ip');
      service.recordFailedAttempt('test-ip');
      service.recordFailedAttempt('test-ip');
      service.recordFailedAttempt('test-ip');
      service.recordFailedAttempt('test-ip');

      expect(service.isBlocked('test-ip')).toBe(true);

      service.clearAttempts('test-ip');
      expect(service.isBlocked('test-ip')).toBe(false);
    });

    it('should return true when blocked', () => {
      for (let i = 0; i < 5; i++) {
        service.recordFailedAttempt('test-ip');
      }

      expect(service.isBlocked('test-ip')).toBe(true);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should record first attempt', () => {
      service.recordFailedAttempt('test-ip');

      expect(service.getRemainingAttempts('test-ip')).toBe(4);
      expect(service.isBlocked('test-ip')).toBe(false);
    });

    it('should increment count on subsequent attempts', () => {
      service.recordFailedAttempt('test-ip');
      service.recordFailedAttempt('test-ip');

      expect(service.getRemainingAttempts('test-ip')).toBe(3);
    });

    it('should block after max attempts', () => {
      for (let i = 0; i < 5; i++) {
        service.recordFailedAttempt('test-ip');
      }

      expect(service.isBlocked('test-ip')).toBe(true);
      expect(service.getRemainingAttempts('test-ip')).toBe(0);
    });
  });

  describe('clearAttempts', () => {
    it('should clear all attempts for identifier', () => {
      service.recordFailedAttempt('test-ip');
      service.recordFailedAttempt('test-ip');

      service.clearAttempts('test-ip');

      expect(service.getRemainingAttempts('test-ip')).toBe(5);
      expect(service.isBlocked('test-ip')).toBe(false);
    });
  });

  describe('getRemainingAttempts', () => {
    it('should return max attempts when no attempts recorded', () => {
      expect(service.getRemainingAttempts('new-ip')).toBe(5);
    });

    it('should return correct remaining attempts', () => {
      service.recordFailedAttempt('test-ip');
      expect(service.getRemainingAttempts('test-ip')).toBe(4);

      service.recordFailedAttempt('test-ip');
      expect(service.getRemainingAttempts('test-ip')).toBe(3);
    });

    it('should not return negative', () => {
      for (let i = 0; i < 10; i++) {
        service.recordFailedAttempt('test-ip');
      }

      expect(service.getRemainingAttempts('test-ip')).toBe(0);
    });
  });

  describe('getBlockTimeRemaining', () => {
    it('should return 0 when not blocked', () => {
      expect(service.getBlockTimeRemaining('test-ip')).toBe(0);
    });

    it('should return positive when blocked', () => {
      for (let i = 0; i < 5; i++) {
        service.recordFailedAttempt('test-ip');
      }

      expect(service.getBlockTimeRemaining('test-ip')).toBeGreaterThan(0);
    });

    it('should return 0 when block expired', () => {
      for (let i = 0; i < 5; i++) {
        service.recordFailedAttempt('test-ip');
      }

      service.clearAttempts('test-ip');

      expect(service.getBlockTimeRemaining('test-ip')).toBe(0);
    });
  });
});
