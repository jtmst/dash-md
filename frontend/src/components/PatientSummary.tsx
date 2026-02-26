import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import { usePatientSummary } from '../hooks/useSummary.ts';

export default function PatientSummary({ patientId }: { patientId: string }) {
  const { data, isLoading, isError, error, refetch } = usePatientSummary(patientId);

  if (isLoading) {
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert
        severity="error"
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        {error instanceof Error ? error.message : 'Failed to load summary'}
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Clinical Summary
          </Typography>
          <Chip
            label={data.mode === 'llm' ? 'Generated via AI' : 'Generated via template'}
            size="small"
            variant="outlined"
            color={data.mode === 'llm' ? 'primary' : 'default'}
          />
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
          {data.summary}
        </Typography>
      </CardContent>
    </Card>
  );
}
