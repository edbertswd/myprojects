// src/hooks/useCourtGuards.js
import { useQuery, useMutation } from '@tanstack/react-query';
import { getActiveBookingsSummary, deleteCourtGuarded } from '../services/courtsApi';

export function useActiveBookingsSummary({ facilityId, courtId }) {
  return useQuery({
    queryKey: ['courts','activeSummary',{ facilityId, courtId }],
    queryFn: () => getActiveBookingsSummary({ facilityId, courtId }),
    enabled: Boolean(facilityId && courtId),
  });
}

export function useDeleteCourt({ facilityId, courtId }) {
  return useMutation({
    mutationFn: ({ force = false } = {}) => deleteCourtGuarded({ facilityId, courtId, force }),
  });
}
