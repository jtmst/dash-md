import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import PatientForm from '../components/PatientForm.tsx';
import { usePatient, useUpdatePatient } from '../hooks/usePatients.ts';
import { parseApiError } from '../utils/errors.ts';
import type { PatientFormData } from '../types/index.ts';

export default function PatientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading, isError, error, refetch } = usePatient(id);
  const updateMutation = useUpdatePatient();
  const [serverError, setServerError] = useState<string | null>(null);

  const isNotFound =
    isError &&
    isAxiosError(error) &&
    (error.response?.status === 404 || error.response?.status === 422);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isNotFound) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" gutterBottom>
          Patient not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          The patient you're trying to edit doesn't exist or has been removed.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/patients')}>
          Back to Patients
        </Button>
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
        {error instanceof Error ? error.message : 'Failed to load patient'}
      </Alert>
    );
  }

  if (!patient) return null;

  const handleSubmit = (data: PatientFormData) => {
    setServerError(null);
    updateMutation.mutate(
      { id: patient.id, data },
      {
        onSuccess: () => {
          navigate(`/patients/${patient.id}`);
        },
        onError: (err) => {
          setServerError(parseApiError(err));
        },
      },
    );
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Edit Patient &mdash; {patient.first_name} {patient.last_name}
      </Typography>
      <PatientForm
        initialData={patient}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/patients/${patient.id}`)}
        isSubmitting={updateMutation.isPending}
        serverError={serverError}
      />
    </>
  );
}
