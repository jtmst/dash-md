import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDeleteNote, useNotes } from '../hooks/useNotes.ts';
import { formatDateTime } from '../utils/format.ts';
import { parseApiError } from '../utils/errors.ts';

export default function NotesList({ patientId }: { patientId: string }) {
  const { data: notes, isLoading, isError, error, refetch } = useNotes(patientId);
  const deleteMutation = useDeleteNote(patientId);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        {error instanceof Error ? error.message : 'Failed to load notes'}
      </Alert>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No notes yet
      </Typography>
    );
  }

  return (
    <Box>
      {deleteError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}
      {notes.map((note, index) => (
        <Box key={note.id}>
          {index > 0 && <Divider sx={{ my: 2 }} />}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                Note from {formatDateTime(note.timestamp)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {note.content}
              </Typography>
            </Box>
            {confirmId === note.id ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, flexShrink: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Delete?
                </Typography>
                <Button
                  size="small"
                  color="error"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    setDeleteError(null);
                    deleteMutation.mutate(note.id, {
                      onSuccess: () => setConfirmId(null),
                      onError: (err) => {
                        setConfirmId(null);
                        setDeleteError(parseApiError(err));
                      },
                    });
                  }}
                >
                  {deleteMutation.isPending ? <CircularProgress size={16} /> : 'Yes'}
                </Button>
                <Button size="small" onClick={() => setConfirmId(null)}>
                  No
                </Button>
              </Box>
            ) : (
              <IconButton
                size="small"
                aria-label="Delete note"
                onClick={() => setConfirmId(note.id)}
                sx={{ ml: 1, flexShrink: 0 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
