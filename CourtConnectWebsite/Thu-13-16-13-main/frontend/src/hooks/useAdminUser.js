//src/hooks/useAdminUser
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUser, suspendUser, unsuspendUser, modifyUserRoles } from '../services/adminApi';

export function useAdminUser(userId) {
  return useQuery({
    queryKey: ['admin','user', userId],
    queryFn: () => getAdminUser(userId),
    select: (res) => res.data,
    enabled: !!userId,
    staleTime: 20_000,
  });
}

export function useSuspendUser(userId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reason, durationDays }) => suspendUser({ userId, reason, durationDays }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin','user', userId] });
      qc.invalidateQueries({ queryKey: ['admin','users'] });
    },
  });
}

export function useUnsuspendUser(userId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unsuspendUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin','user', userId] });
      qc.invalidateQueries({ queryKey: ['admin','users'] });
    },
  });
}

export function useModifyUserRoles(userId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ add = [], remove = [], reason }) => modifyUserRoles({ userId, add, remove, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin','user', userId] });
      qc.invalidateQueries({ queryKey: ['admin','users'] });
    },
  });
}