import { useQuery } from '@tanstack/react-query';
import { getPatientSummary } from '../api/client.ts';

export function usePatientSummary(patientId: string | undefined) {
  return useQuery({
    queryKey: ['summary', patientId],
    queryFn: () => getPatientSummary(patientId!),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}
