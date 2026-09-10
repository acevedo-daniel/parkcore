import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsRevenue,
  getAnalyticsSummary,
  getAnalyticsVolume,
} from '../../lib/api/owner-api.js';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics-summary'],
    queryFn: getAnalyticsSummary,
    staleTime: 30_000,
  });
}

export function useAnalyticsRevenue(days: 7 | 30 = 7) {
  return useQuery({
    queryKey: ['analytics-revenue', days],
    queryFn: () => getAnalyticsRevenue(days),
    staleTime: 60_000,
  });
}

export function useAnalyticsVolume(days: 7 | 30 = 7) {
  return useQuery({
    queryKey: ['analytics-volume', days],
    queryFn: () => getAnalyticsVolume(days),
    staleTime: 60_000,
  });
}
