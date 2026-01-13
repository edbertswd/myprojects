import { describe, it, expect, vi, beforeEach } from 'vitest';

const importReportsApi = async () => {
  return await import('./reportsApi.js');
};

describe('reportsApi (mock helpers)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_USE_MOCK', '1');
  });

  it('generates daily buckets with inclusive date range', async () => {
    const { getUtilizationReport } = await importReportsApi();

    const result = await getUtilizationReport({
      facilityId: 1,
      from: '2025-01-01',
      to: '2025-01-03',
      groupBy: 'day'
    });

    const buckets = Array.from(new Set(result.rows.map((r) => r.bucket)));
    expect(buckets.length).toBe(3);
    buckets.forEach((bucket) => expect(bucket).toMatch(/\d{4}-\d{2}-\d{2}/));

    const courts = new Set(result.rows.map((r) => r.court));
    expect(courts.size).toBeGreaterThan(1);

    const revenueSum = result.rows.reduce((sum, r) => sum + r.revenue, 0);
    expect(result.totals.revenue).toBe(revenueSum);
  });

  it('groups rows by ISO week and aggregates totals', async () => {
    const { getUtilizationReport } = await importReportsApi();

    const result = await getUtilizationReport({
      facilityId: 2,
      from: '2025-01-01',
      to: '2025-01-10',
      groupBy: 'week'
    });

    const uniqueBuckets = Array.from(new Set(result.rows.map((r) => r.bucket)));
    // Expect each court collapsed into the same week bucket (week starting 2024-12-30 and 2025-01-06)
    expect(uniqueBuckets).toEqual(['W2024-12-30', 'W2025-01-06']);

    const byCourt = result.rows.reduce((acc, r) => {
      acc[r.bucket] = (acc[r.bucket] || 0) + r.openHours;
      return acc;
    }, {});
    Object.values(byCourt).forEach((hours) => expect(hours).toBeGreaterThan(0));

    const totalHours = result.rows.reduce((sum, r) => sum + r.openHours, 0);
    expect(result.totals.openHours).toBe(totalHours);
  });
});
