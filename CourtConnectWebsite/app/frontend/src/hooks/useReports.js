// src/hooks/useReports.js
import { useQuery } from '@tanstack/react-query';
import { getUtilizationReport } from '../services/reportsApi';

export function useUtilizationReport(params) {
  return useQuery({
    queryKey: ['reports', 'utilization', params],
    queryFn: () => getUtilizationReport(params),
    enabled: Boolean(params?.facilityId && params?.from && params?.to),
    staleTime: 60_000,
  });
}
