import { useQuery } from '@tanstack/react-query';
import { getAuditLog } from '../services/adminApi';

export function useAuditLog(params) {
  const {
    q = '',
    action = '',
    adminId = '',
    targetUserId = '',
    page = 1,
    pageSize = 10,
  } = params || {};

  return useQuery({
    queryKey: ['admin','audit-log',{ q, action, adminId, targetUserId, page, pageSize }],
    queryFn: () => getAuditLog({ q, action, adminId, targetUserId, page, pageSize }),
    keepPreviousData: true,
    staleTime: 20_000,
  });
}
