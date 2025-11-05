import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger, LogLevel, ConsoleLoggerAdapter } from '../../src/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleDebugSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    logger = new Logger();
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('Info message');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('log level filtering', () => {
    it('should filter logs below minimum level', () => {
      logger.setLevel(LogLevel.WARN);
      logger.debug('Debug message');
      logger.info('Info message');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('child logger', () => {
    it('should create child logger with context', () => {
      const child = logger.createChild('TestModule');
      child.info('Test message');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('getLevel and setLevel', () => {
    it('should get and set log level', () => {
      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });
  });
});

