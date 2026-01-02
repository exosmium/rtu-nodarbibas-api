import { beforeAll, describe, expect, it } from 'vitest';
import { DiscoveryService } from '../src/schedule/discovery.js';
import { DiscoveryError } from '../src/schedule/errors.js';
import { RTUHtmlParser } from '../src/html-parser.js';

/**
 * Real API endpoint tests for DiscoveryService
 * These tests hit the actual RTU website - no mocking
 */

describe('DiscoveryService (Real API)', () => {
  let discoveryService: DiscoveryService;
  let htmlParser: RTUHtmlParser;

  beforeAll(() => {
    htmlParser = new RTUHtmlParser();
    discoveryService = new DiscoveryService(htmlParser);
  });

  // =========================================================================
  // discoverPeriods() Tests
  // =========================================================================
  describe('discoverPeriods()', () => {
    it('should fetch and parse real periods from RTU website', async () => {
      const periods = await discoveryService.discoverPeriods();

      expect(periods).toBeInstanceOf(Array);
      expect(periods.length).toBeGreaterThan(0);

      // Verify structure of first period
      const period = periods[0]!;
      expect(period).toHaveProperty('id');
      expect(period).toHaveProperty('name');
      expect(period).toHaveProperty('code');
      expect(period).toHaveProperty('academicYear');
      expect(period).toHaveProperty('season');
      expect(period).toHaveProperty('startDate');
      expect(period).toHaveProperty('endDate');
      expect(period).toHaveProperty('isSelected');
    }, 30000);

    it('should include a currently selected period', async () => {
      const periods = await discoveryService.discoverPeriods();

      const selectedPeriod = periods.find((p) => p.isSelected === true);
      expect(selectedPeriod).toBeDefined();
    }, 30000);

    it('should correctly parse period code from name', async () => {
      const periods = await discoveryService.discoverPeriods();

      // Find a period with autumn code
      const autumnPeriod = periods.find((p) => p.code.endsWith('-R'));
      if (autumnPeriod) {
        expect(autumnPeriod.season).toBe('autumn');
      }

      // Find a period with spring code
      const springPeriod = periods.find((p) => p.code.endsWith('-P'));
      if (springPeriod) {
        expect(springPeriod.season).toBe('spring');
      }
    }, 30000);

    it('should have valid date objects for startDate and endDate', async () => {
      const periods = await discoveryService.discoverPeriods();
      const period = periods[0]!;

      expect(period.startDate).toBeInstanceOf(Date);
      expect(period.endDate).toBeInstanceOf(Date);
      expect(period.startDate.getTime()).toBeLessThanOrEqual(
        period.endDate.getTime()
      );
    }, 30000);

    it('should cache response on subsequent calls', async () => {
      const startTime = Date.now();
      await discoveryService.discoverPeriods();
      const firstCallDuration = Date.now() - startTime;

      const secondStartTime = Date.now();
      await discoveryService.discoverPeriods();
      const secondCallDuration = Date.now() - secondStartTime;

      // Second call should be fast due to caching (either faster or same speed at ~0ms)
      expect(secondCallDuration).toBeLessThanOrEqual(firstCallDuration);
    }, 30000);
  });

  // =========================================================================
  // discoverPrograms() Tests
  // =========================================================================
  describe('discoverPrograms()', () => {
    it('should fetch programs for a valid period', async () => {
      const periods = await discoveryService.discoverPeriods();
      const currentPeriod = periods.find((p) => p.isSelected) ?? periods[0]!;

      const programs = await discoveryService.discoverPrograms(
        currentPeriod.id
      );

      expect(programs).toBeInstanceOf(Array);
      expect(programs.length).toBeGreaterThan(0);

      // Verify structure of first program
      const program = programs[0]!;
      expect(program).toHaveProperty('id');
      expect(program).toHaveProperty('name');
      expect(program).toHaveProperty('code');
      expect(program).toHaveProperty('fullName');
      expect(program).toHaveProperty('faculty');
      expect(program).toHaveProperty('tokens');
    }, 30000);

    it('should find Datorsistemas (RDBD0) program', async () => {
      const periods = await discoveryService.discoverPeriods();
      const currentPeriod = periods.find((p) => p.isSelected) ?? periods[0]!;

      const programs = await discoveryService.discoverPrograms(
        currentPeriod.id
      );

      const datorsistemas = programs.find((p) => p.code === 'RDBD0');
      expect(datorsistemas).toBeDefined();
      expect(datorsistemas?.name).toContain('Datorsistēmas');
      expect(datorsistemas?.faculty).toBeDefined();
    }, 30000);

    it('should associate correct faculty with each program', async () => {
      const periods = await discoveryService.discoverPeriods();
      const currentPeriod = periods.find((p) => p.isSelected) ?? periods[0]!;

      const programs = await discoveryService.discoverPrograms(
        currentPeriod.id
      );

      // All programs should have a faculty with name and code
      for (const program of programs) {
        expect(program.faculty).toHaveProperty('name');
        expect(program.faculty).toHaveProperty('code');
        expect(program.faculty.name.length).toBeGreaterThan(0);
        expect(program.faculty.code.length).toBeGreaterThan(0);
      }
    }, 30000);

    it('should cache programs per periodId', async () => {
      const periods = await discoveryService.discoverPeriods();
      const periodId = periods[0]!.id;

      const startTime = Date.now();
      await discoveryService.discoverPrograms(periodId);
      const firstCallDuration = Date.now() - startTime;

      const secondStartTime = Date.now();
      await discoveryService.discoverPrograms(periodId);
      const secondCallDuration = Date.now() - secondStartTime;

      // Second call should be fast due to caching (either faster or same speed at ~0ms)
      expect(secondCallDuration).toBeLessThanOrEqual(firstCallDuration);
    }, 30000);
  });

  // =========================================================================
  // discoverCurrentPeriod() Tests
  // =========================================================================
  describe('discoverCurrentPeriod()', () => {
    it('should return the currently selected period', async () => {
      const currentPeriod = await discoveryService.discoverCurrentPeriod();

      expect(currentPeriod).not.toBeNull();
      expect(currentPeriod!.isSelected).toBe(true);
      expect(currentPeriod!.id).toBeGreaterThan(0);
    }, 30000);

    it('should have all required period properties', async () => {
      const currentPeriod = await discoveryService.discoverCurrentPeriod();

      expect(currentPeriod).not.toBeNull();
      expect(currentPeriod!.name).toBeDefined();
      expect(currentPeriod!.code).toBeDefined();
      expect(currentPeriod!.academicYear).toBeDefined();
      expect(currentPeriod!.season).toBeDefined();
      expect(currentPeriod!.startDate).toBeInstanceOf(Date);
      expect(currentPeriod!.endDate).toBeInstanceOf(Date);
    }, 30000);
  });

  // =========================================================================
  // clearCache() Tests
  // =========================================================================
  describe('clearCache()', () => {
    it('should clear cache without throwing', async () => {
      // First, populate the cache
      await discoveryService.discoverPeriods();

      // Clear cache should not throw
      expect(() => discoveryService.clearCache()).not.toThrow();
    }, 30000);

    it('should force refetch after clearCache', async () => {
      await discoveryService.discoverPeriods();
      discoveryService.clearCache();

      // After clearing, this should make a new network request
      const periods = await discoveryService.discoverPeriods();
      expect(periods.length).toBeGreaterThan(0);
    }, 30000);
  });

  // =========================================================================
  // Error handling Tests
  // =========================================================================
  describe('Error handling', () => {
    it('should throw DiscoveryError for invalid URL', async () => {
      const badService = new DiscoveryService(new RTUHtmlParser(), {
        baseUrl: 'https://invalid-domain-that-does-not-exist-xyz.com',
      });

      await expect(badService.discoverPeriods()).rejects.toThrow(
        DiscoveryError
      );
    }, 30000);
  });

  // =========================================================================
  // Constructor options Tests
  // =========================================================================
  describe('Constructor options', () => {
    it('should work with default options', () => {
      const service = new DiscoveryService(new RTUHtmlParser());
      expect(service).toBeInstanceOf(DiscoveryService);
    });

    it('should accept custom cache timeout', async () => {
      const service = new DiscoveryService(new RTUHtmlParser(), {
        cacheTimeout: 1000, // 1 second
      });

      const periods = await service.discoverPeriods();
      expect(periods.length).toBeGreaterThan(0);
    }, 30000);
  });

  // =========================================================================
  // Period transformation Tests
  // =========================================================================
  describe('Period transformation', () => {
    it('should correctly detect autumn season from name', async () => {
      const periods = await discoveryService.discoverPeriods();

      const autumnPeriods = periods.filter((p) => p.season === 'autumn');
      for (const period of autumnPeriods) {
        expect(
          period.name.toLowerCase().includes('rudens') ||
            period.code.endsWith('-R')
        ).toBe(true);
      }
    }, 30000);

    it('should correctly detect spring season from name', async () => {
      const periods = await discoveryService.discoverPeriods();

      const springPeriods = periods.filter((p) => p.season === 'spring');
      for (const period of springPeriods) {
        expect(
          period.name.toLowerCase().includes('pavasara') ||
            period.code.endsWith('-P')
        ).toBe(true);
      }
    }, 30000);

    it('should extract academic year correctly', async () => {
      const periods = await discoveryService.discoverPeriods();

      for (const period of periods) {
        // Academic year should be in format YYYY/YYYY
        expect(period.academicYear).toMatch(/^\d{4}\/\d{4}$/);
      }
    }, 30000);
  });
});
