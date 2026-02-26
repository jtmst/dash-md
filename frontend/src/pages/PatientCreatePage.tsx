import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';
import PatientForm from '../components/PatientForm.tsx';
import { useCreatePatient } from '../hooks/usePatients.ts';
import { parseApiError } from '../utils/errors.ts';
import type { PatientFormData } from '../types/index.ts';

export default function PatientCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreatePatient();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = (data: PatientFormData) => {
    setServerError(null);
    createMutation.mutate(data, {
      onSuccess: (patient) => {
        navigate(`/patients/${patient.id}`);
      },
      onError: (err) => {
        setServerError(parseApiError(err));
      },
    });
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        New Patient
      </Typography>
      <PatientForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/patients')}
        isSubmitting={createMutation.isPending}
        serverError={serverError}
      />
    </>
  );
}
