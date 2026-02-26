import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPatient, deletePatient, getPatient, getPatients, updatePatient } from '../api/client.ts';
import type { PatientFormData, PatientListParams } from '../types/index.ts';

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

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PatientFormData) => createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatientFormData }) => updatePatient(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['summary', variables.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
