// src/hooks/useSportTypes.js
import { useQuery } from '@tanstack/react-query';
import { getSportTypes } from '../services/courtsApi';

/**
 * Fetch all sport types from the backend
 * Returns: { sport_type_id, sport_name, created_at }[]
 */
export function useSportTypes() {
  return useQuery({
    queryKey: ['sportTypes'],
    queryFn: getSportTypes,
    staleTime: 1000 * 60 * 60, // Sport types rarely change, cache for 1 hour
  });
}

/**
 * Build a map of sport name to sport type ID for easy lookup
 * @param {Array} sportTypes - Array of sport type objects
 * @returns {Object} Map of sport_name -> sport_type_id
 */
export function buildSportTypeMap(sportTypes) {
  if (!sportTypes || !Array.isArray(sportTypes)) return {};

  const map = {};
  sportTypes.forEach(st => {
    map[st.sport_name] = st.sport_type_id;
  });
  return map;
}
