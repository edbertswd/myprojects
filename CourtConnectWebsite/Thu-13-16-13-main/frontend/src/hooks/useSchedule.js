// src/hooks/useSchedule.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedule, patchSchedule } from '../services/scheduleApi';

export function useWeeklySchedule({ facilityId, courtId, weekStartISO }) {
  return useQuery({
    queryKey: ['schedule','week',{ facilityId, courtId, weekStartISO }],
    queryFn: () => getSchedule({ facilityId, courtId, weekStartISO }),
    enabled: Boolean(facilityId && courtId && weekStartISO),
    staleTime: 30_000,
  });
}

export function usePatchSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, courtId, changes }) => patchSchedule({ facilityId, courtId, changes }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['schedule','week',{ facilityId: vars.facilityId, courtId: vars.courtId, weekStartISO: vars.weekStartISO }]);
    }
  });

}

