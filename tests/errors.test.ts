import { describe, expect, it } from 'vitest';
import {
  CourseNotFoundError,
  DiscoveryError,
  GroupNotFoundError,
  InvalidOptionsError,
  PeriodNotFoundError,
  ProgramNotFoundError,
  RTUScheduleError,
  ScheduleNotPublishedError,
} from '../src/schedule/errors.js';

describe('Error Classes', () => {
  describe('RTUScheduleError', () => {
    it('should set message correctly', () => {
      const error = new RTUScheduleError('Test error message');
      expect(error.message).toBe('Test error message');
    });

    it('should have name property set to RTUScheduleError', () => {
      const error = new RTUScheduleError('Test error');
      expect(error.name).toBe('RTUScheduleError');
    });

    it('should preserve cause when provided', () => {
      const cause = new Error('Original error');
      const error = new RTUScheduleError('Wrapped error', cause);
      expect(error.cause).toBe(cause);
    });

    it('should include cause stack trace in stack', () => {
      const cause = new Error('Original error');
      const error = new RTUScheduleError('Wrapped error', cause);
      expect(error.stack).toContain('Caused by:');
      expect(error.stack).toContain('Original error');
    });

    it('should work without cause', () => {
      const error = new RTUScheduleError('Error without cause');
      expect(error.cause).toBeUndefined();
      expect(error.stack).not.toContain('Caused by:');
    });

    it('should be an instance of Error', () => {
      const error = new RTUScheduleError('Test');
      expect(error).toBeInstanceOf(Error);
    });

    it('should be an instance of RTUScheduleError', () => {
      const error = new RTUScheduleError('Test');
      expect(error).toBeInstanceOf(RTUScheduleError);
    });
  });

  describe('PeriodNotFoundError', () => {
    it('should work with numeric input', () => {
      const error = new PeriodNotFoundError(123);
      expect(error.input).toBe(123);
      expect(error.message).toBe('Study period not found: "123"');
    });

    it('should work with string input', () => {
      const error = new PeriodNotFoundError('25/26-R');
      expect(error.input).toBe('25/26-R');
      expect(error.message).toBe('Study period not found: "25/26-R"');
    });

    it('should have correct message format', () => {
      const error = new PeriodNotFoundError('test-period');
      expect(error.message).toMatch(/^Study period not found: ".+"$/);
    });

    it('should have name property set to PeriodNotFoundError', () => {
      const error = new PeriodNotFoundError(1);
      expect(error.name).toBe('PeriodNotFoundError');
    });

    it('should preserve input property', () => {
      const numericError = new PeriodNotFoundError(42);
      const stringError = new PeriodNotFoundError('period-code');
      expect(numericError.input).toBe(42);
      expect(stringError.input).toBe('period-code');
    });

    it('should extend RTUScheduleError', () => {
      const error = new PeriodNotFoundError(1);
      expect(error).toBeInstanceOf(RTUScheduleError);
    });

    it('should be catchable as RTUScheduleError', () => {
      let caught = false;
      try {
        throw new PeriodNotFoundError(1);
      } catch (e) {
        if (e instanceof RTUScheduleError) {
          caught = true;
        }
      }
      expect(caught).toBe(true);
    });
  });

  describe('ProgramNotFoundError', () => {
    it('should work with numeric input', () => {
      const error = new ProgramNotFoundError(456);
      expect(error.input).toBe(456);
      expect(error.message).toBe('Study program not found: "456"');
    });

    it('should work with string input', () => {
      const error = new ProgramNotFoundError('RDBD0');
      expect(error.input).toBe('RDBD0');
      expect(error.message).toBe('Study program not found: "RDBD0"');
    });

    it('should have correct message format', () => {
      const error = new ProgramNotFoundError('RITI0');
      expect(error.message).toMatch(/^Study program not found: ".+"$/);
    });

    it('should have name property set to ProgramNotFoundError', () => {
      const error = new ProgramNotFoundError('test');
      expect(error.name).toBe('ProgramNotFoundError');
    });

    it('should extend RTUScheduleError', () => {
      const error = new ProgramNotFoundError('test');
      expect(error).toBeInstanceOf(RTUScheduleError);
    });

    it('should be catchable as ProgramNotFoundError', () => {
      let caught = false;
      try {
        throw new ProgramNotFoundError('test');
      } catch (e) {
        if (e instanceof ProgramNotFoundError) {
          caught = true;
        }
      }
      expect(caught).toBe(true);
    });
  });

  describe('CourseNotFoundError', () => {
    it('should work with course number', () => {
      const error = new CourseNotFoundError(1);
      expect(error.courseNumber).toBe(1);
      expect(error.message).toBe('Course 1 not found');
    });

    it('should have correct message format', () => {
      const error = new CourseNotFoundError(3);
      expect(error.message).toBe('Course 3 not found');
    });

    it('should have name property set to CourseNotFoundError', () => {
      const error = new CourseNotFoundError(2);
      expect(error.name).toBe('CourseNotFoundError');
    });

    it('should preserve courseNumber property', () => {
      const error = new CourseNotFoundError(5);
      expect(error.courseNumber).toBe(5);
    });

    it('should extend RTUScheduleError', () => {
      const error = new CourseNotFoundError(1);
      expect(error).toBeInstanceOf(RTUScheduleError);
    });

    it('should work with various course numbers', () => {
      expect(new CourseNotFoundError(1).message).toBe('Course 1 not found');
      expect(new CourseNotFoundError(4).message).toBe('Course 4 not found');
      expect(new CourseNotFoundError(6).message).toBe('Course 6 not found');
    });
  });

  describe('GroupNotFoundError', () => {
    it('should work with group number', () => {
      const error = new GroupNotFoundError(13);
      expect(error.groupNumber).toBe(13);
      expect(error.message).toBe('Group 13 not found');
    });

    it('should have correct message format', () => {
      const error = new GroupNotFoundError(7);
      expect(error.message).toBe('Group 7 not found');
    });

    it('should have name property set to GroupNotFoundError', () => {
      const error = new GroupNotFoundError(1);
      expect(error.name).toBe('GroupNotFoundError');
    });

    it('should preserve groupNumber property', () => {
      const error = new GroupNotFoundError(25);
      expect(error.groupNumber).toBe(25);
    });

    it('should extend RTUScheduleError', () => {
      const error = new GroupNotFoundError(1);
      expect(error).toBeInstanceOf(RTUScheduleError);
    });

    it('should work with various group numbers', () => {
      expect(new GroupNotFoundError(1).message).toBe('Group 1 not found');
      expect(new GroupNotFoundError(99).message).toBe('Group 99 not found');
    });
  });

  describe('ScheduleNotPublishedError', () => {
    it('should have default message', () => {
      const error = new ScheduleNotPublishedError();
      expect(error.message).toBe('Schedule is not yet published');
    });

    it('should have name property set to ScheduleNotPublishedError', () => {
      const error = new ScheduleNotPublishedError();
      expect(error.name).toBe('ScheduleNotPublishedError');
    });

    it('should extend RTUScheduleError', () => {
      const error = new ScheduleNotPublishedError();
      expect(error).toBeInstanceOf(RTUScheduleError);
    });

    it('should be catchable as RTUScheduleError', () => {
      let caught = false;
      try {
        throw new ScheduleNotPublishedError();
      } catch (e) {
        if (e instanceof RTUScheduleError) {
          caught = true;
        }
      }
      expect(caught).toBe(true);
    });

    it('should be catchable as ScheduleNotPublishedError', () => {
      let caught = false;
      try {
        throw new ScheduleNotPublishedError();
      } catch (e) {
        if (e instanceof ScheduleNotPublishedError) {
          caught = true;
        }
      }
      expect(caught).toBe(true);
    });
  });

  describe('DiscoveryError', () => {
    it('should work with message only', () => {
      const error = new DiscoveryError('connection timeout');
      expect(error.message).toBe(
        'Failed to discover RTU data: connection timeout'
      );
    });

    it('should work with message and cause', () => {
      const cause = new Error('Network error');
      const error = new DiscoveryError('connection failed', cause);
      expect(error.message).toBe(
        'Failed to discover RTU data: connection failed'
      );
      expect(error.cause).toBe(cause);
    });

    it('should include cause stack trace', () => {
      const cause = new Error('Original network error');
      const error = new DiscoveryError('failed to fetch', cause);
      expect(error.stack).toContain('Caused by:');
      expect(error.stack).toContain('Original network error');
    });

    it('should have name property set to DiscoveryError', () => {
      const error = new DiscoveryError('test');
      expect(error.name).toBe('DiscoveryError');
    });

    it('should extend RTUScheduleError', () => {
      const error = new DiscoveryError('test');
      expect(error).toBeInstanceOf(RTUScheduleError);
    });

    it('should have correct message format', () => {
      const error = new DiscoveryError('some error');
      expect(error.message).toMatch(/^Failed to discover RTU data: .+$/);
    });
  });

  describe('InvalidOptionsError', () => {
    it('should work with various messages', () => {
      const error1 = new InvalidOptionsError('course is required');
      expect(error1.message).toBe(
        'Invalid schedule options: course is required'
      );

      const error2 = new InvalidOptionsError('period cannot be empty');
      expect(error2.message).toBe(
        'Invalid schedule options: period cannot be empty'
      );

      const error3 = new InvalidOptionsError('invalid date format');
      expect(error3.message).toBe(
        'Invalid schedule options: invalid date format'
      );
    });

    it('should have name property set to InvalidOptionsError', () => {
      const error = new InvalidOptionsError('test');
      expect(error.name).toBe('InvalidOptionsError');
    });

    it('should extend RTUScheduleError', () => {
      const error = new InvalidOptionsError('test');
      expect(error).toBeInstanceOf(RTUScheduleError);
    });

    it('should have correct message format', () => {
      const error = new InvalidOptionsError('something went wrong');
      expect(error.message).toMatch(/^Invalid schedule options: .+$/);
    });
  });

  describe('Inheritance and instanceof checks', () => {
    it('all errors should extend RTUScheduleError', () => {
      expect(new PeriodNotFoundError(1)).toBeInstanceOf(RTUScheduleError);
      expect(new ProgramNotFoundError('test')).toBeInstanceOf(RTUScheduleError);
      expect(new CourseNotFoundError(1)).toBeInstanceOf(RTUScheduleError);
      expect(new GroupNotFoundError(1)).toBeInstanceOf(RTUScheduleError);
      expect(new ScheduleNotPublishedError()).toBeInstanceOf(RTUScheduleError);
      expect(new DiscoveryError('test')).toBeInstanceOf(RTUScheduleError);
      expect(new InvalidOptionsError('test')).toBeInstanceOf(RTUScheduleError);
    });

    it('all errors should extend Error', () => {
      expect(new RTUScheduleError('test')).toBeInstanceOf(Error);
      expect(new PeriodNotFoundError(1)).toBeInstanceOf(Error);
      expect(new ProgramNotFoundError('test')).toBeInstanceOf(Error);
      expect(new CourseNotFoundError(1)).toBeInstanceOf(Error);
      expect(new GroupNotFoundError(1)).toBeInstanceOf(Error);
      expect(new ScheduleNotPublishedError()).toBeInstanceOf(Error);
      expect(new DiscoveryError('test')).toBeInstanceOf(Error);
      expect(new InvalidOptionsError('test')).toBeInstanceOf(Error);
    });

    it('errors should be catchable by their specific type', () => {
      const errors = [
        { error: new PeriodNotFoundError(1), type: PeriodNotFoundError },
        { error: new ProgramNotFoundError('test'), type: ProgramNotFoundError },
        { error: new CourseNotFoundError(1), type: CourseNotFoundError },
        { error: new GroupNotFoundError(1), type: GroupNotFoundError },
        {
          error: new ScheduleNotPublishedError(),
          type: ScheduleNotPublishedError,
        },
        { error: new DiscoveryError('test'), type: DiscoveryError },
        { error: new InvalidOptionsError('test'), type: InvalidOptionsError },
      ];

      errors.forEach(({ error, type }) => {
        let caught = false;
        try {
          throw error;
        } catch (e) {
          if (e instanceof type) {
            caught = true;
          }
        }
        expect(caught).toBe(true);
      });
    });

    it('errors should be distinguishable from each other', () => {
      const periodError = new PeriodNotFoundError(1);
      const programError = new ProgramNotFoundError('test');

      expect(periodError).toBeInstanceOf(PeriodNotFoundError);
      expect(periodError).not.toBeInstanceOf(ProgramNotFoundError);

      expect(programError).toBeInstanceOf(ProgramNotFoundError);
      expect(programError).not.toBeInstanceOf(PeriodNotFoundError);
    });

    it('should be able to catch all RTU errors in a single catch block', () => {
      const errors = [
        new PeriodNotFoundError(1),
        new ProgramNotFoundError('test'),
        new CourseNotFoundError(1),
        new GroupNotFoundError(1),
        new ScheduleNotPublishedError(),
        new DiscoveryError('test'),
        new InvalidOptionsError('test'),
      ];

      errors.forEach((error) => {
        let caughtAsRTUError = false;
        try {
          throw error;
        } catch (e) {
          if (e instanceof RTUScheduleError) {
            caughtAsRTUError = true;
          }
        }
        expect(caughtAsRTUError).toBe(true);
      });
    });
  });

  describe('Error properties and behavior', () => {
    it('all errors should have a stack trace', () => {
      const errors = [
        new RTUScheduleError('test'),
        new PeriodNotFoundError(1),
        new ProgramNotFoundError('test'),
        new CourseNotFoundError(1),
        new GroupNotFoundError(1),
        new ScheduleNotPublishedError(),
        new DiscoveryError('test'),
        new InvalidOptionsError('test'),
      ];

      errors.forEach((error) => {
        expect(error.stack).toBeDefined();
        expect(typeof error.stack).toBe('string');
        expect(error.stack!.length).toBeGreaterThan(0);
      });
    });

    it('error names should match class names', () => {
      expect(new RTUScheduleError('test').name).toBe('RTUScheduleError');
      expect(new PeriodNotFoundError(1).name).toBe('PeriodNotFoundError');
      expect(new ProgramNotFoundError('test').name).toBe(
        'ProgramNotFoundError'
      );
      expect(new CourseNotFoundError(1).name).toBe('CourseNotFoundError');
      expect(new GroupNotFoundError(1).name).toBe('GroupNotFoundError');
      expect(new ScheduleNotPublishedError().name).toBe(
        'ScheduleNotPublishedError'
      );
      expect(new DiscoveryError('test').name).toBe('DiscoveryError');
      expect(new InvalidOptionsError('test').name).toBe('InvalidOptionsError');
    });

    it('RTUScheduleError cause chain should work correctly', () => {
      const originalError = new Error('Database connection failed');
      const discoveryError = new DiscoveryError(
        'Could not load periods',
        originalError
      );
      const wrappedError = new RTUScheduleError(
        'Schedule fetch failed',
        discoveryError
      );

      expect(wrappedError.cause).toBe(discoveryError);
      expect(wrappedError.stack).toContain('Caused by:');
      expect(wrappedError.stack).toContain('Could not load periods');
      expect(wrappedError.stack).toContain('Database connection failed');
    });
  });
});
