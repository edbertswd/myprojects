// src/hooks/useCourts.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listCourts, getCourt, createCourt, updateCourt, deleteCourt } from '../services/courtsApi';
import { listCourtOptions } from '../services/courtsApi';

function keyList(facilityId, q, page, pageSize) {
  return ['courts', 'list', { facilityId, q, page, pageSize }];
}
function keyOne(facilityId, courtId) {
  return ['courts', 'one', { facilityId, courtId }];
}

export function useCourtsList({ facilityId, q, page, pageSize = 10 }) {
  return useQuery({
    queryKey: keyList(facilityId, q, page, pageSize),
    queryFn: () => listCourts({ facilityId, q, page, pageSize }),
    staleTime: 10_000,
    enabled: !!facilityId,
  });
}

export function useCourt({ facilityId, courtId }) {
  return useQuery({
    queryKey: keyOne(facilityId, courtId),
    queryFn: () => getCourt({ facilityId, courtId }),
    enabled: !!facilityId && !!courtId,
  });
}

export function useCreateCourt({ facilityId }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createCourt({ facilityId, payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courts', 'list'] });
    },
  });
}

export function useUpdateCourt({ facilityId, courtId }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateCourt({ facilityId, courtId, payload }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['courts', 'list'] });
      qc.setQueryData(keyOne(facilityId, courtId), data);
    },
  });
}

export function useDeleteCourt({ facilityId, q, page, pageSize = 10 }) {
  const qc = useQueryClient();
  const listKey = keyList(facilityId, q, page, pageSize);

  return useMutation({
    mutationFn: ({ courtId }) => deleteCourt({ facilityId, courtId }),

    // optimistic update: remove from list cache
    onMutate: async ({ courtId }) => {
      await qc.cancelQueries({ queryKey: listKey });
      const prev = qc.getQueryData(listKey);
      if (prev) {
        const next = { ...prev, results: prev.results.filter((c) => c.id !== Number(courtId)), total: Math.max(0, (prev.total || 0) - 1) };
        qc.setQueryData(listKey, next);
      }
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(listKey, ctx.prev); // rollback
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: listKey });
    },
  });
}

export function useCourtOptions({ facilityId }) {
  return useQuery({
    queryKey: ['courts','options',{ facilityId }],
    queryFn: () => listCourtOptions({ facilityId }),
    enabled: Boolean(facilityId),
    staleTime: 60_000,
  });
}
