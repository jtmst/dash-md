import { useQuery } from '@tanstack/react-query';
import { getPatient, getPatients } from '../api/client.ts';
import type { PatientListParams } from '../types/index.ts';

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => getPatients(params),
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => getPatient(id!),
    enabled: !!id,
  });
}
