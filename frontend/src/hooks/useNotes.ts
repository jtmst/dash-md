import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNote, deleteNote, getNotes } from '../api/client.ts';
import type { NoteFormData } from '../types/index.ts';

export function useNotes(patientId: string) {
  return useQuery({
    queryKey: ['notes', patientId],
    queryFn: () => getNotes(patientId),
  });
}

export function useCreateNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NoteFormData) => createNote(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', patientId] });
      queryClient.invalidateQueries({ queryKey: ['summary', patientId] });
    },
  });
}

export function useDeleteNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(patientId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', patientId] });
      queryClient.invalidateQueries({ queryKey: ['summary', patientId] });
    },
  });
}
