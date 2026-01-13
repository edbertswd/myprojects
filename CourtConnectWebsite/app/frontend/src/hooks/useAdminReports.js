import { useQuery } from '@tanstack/react-query';
import { getSystemReports } from '../services/adminApi';

export function useAdminReports({ range = '7d' } = {}) {
  return useQuery({
    queryKey: ['admin','reports', { range }],
    queryFn: () => getSystemReports({ range }),
    select: (res) => res.data,
    staleTime: 20_000,
  });
}
