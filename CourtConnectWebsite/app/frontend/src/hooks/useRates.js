// src/hooks/useRates.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRate, updateRate } from '../services/ratesApi';

export function useRate({ facilityId, courtId }) {
  return useQuery({
    queryKey: ['rate', String(facilityId), String(courtId)],
    queryFn: () => getRate({ facilityId, courtId }),
    staleTime: 0, // always fresh when we come back
  });
}

export function useUpdateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, courtId, ratePerHour, currency = 'AUD' }) =>
      updateRate({ facilityId, courtId, ratePerHour, currency }),
    onSuccess: (data, vars) => {
      // update + invalidate the specific court’s rate
      qc.setQueryData(['rate', String(vars.facilityId), String(vars.courtId)], data);
      qc.invalidateQueries({ queryKey: ['rate', String(vars.facilityId), String(vars.courtId)] });
    },
  });
}
