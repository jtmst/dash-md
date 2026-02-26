import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, TextField } from '@mui/material';
import { useCreateNote } from '../hooks/useNotes.ts';
import { parseApiError } from '../utils/errors.ts';

function getLocalDatetimeString(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function NoteForm({ patientId }: { patientId: string }) {
  const [content, setContent] = useState('');
  const [timestamp, setTimestamp] = useState(getLocalDatetimeString);
  const [contentError, setContentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateNote(patientId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContentError(null);
    setSubmitError(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setContentError('Note content is required');
      return;
    }

    const parsed = new Date(timestamp);
    if (!timestamp || isNaN(parsed.getTime())) {
      setSubmitError('Please enter a valid date and time');
      return;
    }

    const isoTimestamp = parsed.toISOString();
    createMutation.mutate(
      { content: trimmed, timestamp: isoTimestamp },
      {
        onSuccess: () => {
          setContent('');
          setTimestamp(getLocalDatetimeString());
        },
        onError: (err) => {
          setSubmitError(parseApiError(err));
        },
      },
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
      <TextField
        label="Add a clinical note"
        multiline
        rows={3}
        fullWidth
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (contentError) setContentError(null);
        }}
        error={!!contentError}
        helperText={contentError}
        inputProps={{ maxLength: 10000 }}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Timestamp"
          type="datetime-local"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={createMutation.isPending}
          startIcon={createMutation.isPending ? <CircularProgress size={20} /> : undefined}
        >
          Add Note
        </Button>
      </Box>
      {submitError && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}
    </Box>
  );
}
