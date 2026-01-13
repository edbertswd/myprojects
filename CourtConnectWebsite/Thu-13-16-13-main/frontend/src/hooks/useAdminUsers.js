//src/hooks/useAdminUsers
import { useQuery } from '@tanstack/react-query';
import { getAdminUsers } from '../services/adminApi';

export function useAdminUsers(params) {
  const { q = '', role = '', status = '', page = 1, pageSize = 10 } = params || {};
  return useQuery({
    queryKey: ['admin','users',{ q, role, status, page, pageSize }],
    queryFn: () => getAdminUsers({ q, role, status, page, pageSize }),
    keepPreviousData: true,
    staleTime: 20_000,
  });
}
