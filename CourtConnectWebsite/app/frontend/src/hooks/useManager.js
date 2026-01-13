// src/hooks/useManager.js
import { useQuery } from '@tanstack/react-query';
import { getManagerOverview, getManagerFacilities, getManagerFacility } from '../services/managerApi';

/**
 * Fetch manager overview data (bookings today, next 7 days, facilities)
 */
export function useManagerOverview() {
  return useQuery({
    queryKey: ['manager', 'overview'],
    queryFn: getManagerOverview,
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Fetch list of facilities owned by the manager
 */
export function useManagerFacilities() {
  return useQuery({
    queryKey: ['manager', 'facilities'],
    queryFn: getManagerFacilities,
    staleTime: 60_000,
  });
}

/**
 * Fetch a single facility owned by the manager
 */
export function useManagerFacility(facilityId) {
  return useQuery({
    queryKey: ['manager', 'facilities', facilityId],
    queryFn: () => getManagerFacility(facilityId),
    enabled: !!facilityId,
    staleTime: 60_000,
  });
}
