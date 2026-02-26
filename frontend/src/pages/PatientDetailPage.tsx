import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { usePatient } from '../hooks/usePatients.ts';
import { calculateAge, formatDate } from '../utils/format.ts';
import type { Patient } from '../types/index.ts';
import { isAxiosError } from 'axios';

const STATUS_COLORS = {
  active: 'success',
  inactive: 'warning',
  critical: 'error',
} as const;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', py: 0.75 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ width: 120, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{value}</Typography>
    </Box>
  );
}

function ChipList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {items.map((item) => (
        <Chip key={item} label={item} size="small" variant="outlined" />
      ))}
    </Box>
  );
}

function PersonalInfoCard({ patient }: { patient: Patient }) {
  const age = calculateAge(patient.date_of_birth);
  const dobDisplay = age !== null
    ? `${formatDate(patient.date_of_birth)} (${age} years old)`
    : formatDate(patient.date_of_birth);
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          Personal Information
        </Typography>
        <InfoRow label="Date of Birth" value={dobDisplay} />
        <InfoRow label="Gender" value={patient.gender} />
        <InfoRow label="Email" value={patient.email} />
        <InfoRow label="Phone" value={patient.phone} />
        <InfoRow label="Address" value={patient.address} />
      </CardContent>
    </Card>
  );
}

function MedicalInfoCard({ patient }: { patient: Patient }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          Medical Information
        </Typography>
        <InfoRow label="Blood Type" value={patient.blood_type ?? 'Not on file'} />
        <Box sx={{ py: 0.75 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 0.5 }}
          >
            Allergies
          </Typography>
          <ChipList items={patient.allergies} emptyText="None recorded" />
        </Box>
        <Box sx={{ py: 0.75 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 0.5 }}
          >
            Conditions
          </Typography>
          <ChipList items={patient.conditions} emptyText="None recorded" />
        </Box>
      </CardContent>
    </Card>
  );
}

function RecordInfoCard({ patient }: { patient: Patient }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          Record Information
        </Typography>
        <InfoRow label="Patient ID" value={patient.id} />
        <InfoRow
          label="Last Visit"
          value={patient.last_visit_date ? formatDate(patient.last_visit_date) : 'No visits recorded'}
        />
        <InfoRow label="Created" value={formatDate(patient.created_at)} />
        <InfoRow label="Last Updated" value={formatDate(patient.updated_at)} />
      </CardContent>
    </Card>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading, isError, error, refetch } = usePatient(id);

  const isNotFound = isError && isAxiosError(error) &&
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
          The patient you're looking for doesn't exist or has been removed.
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

  return (
    <>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/patients')}
        sx={{ mb: 2 }}
      >
        Back to Patients
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4">
          {patient.first_name} {patient.last_name}
        </Typography>
        <Chip
          label={patient.status}
          color={STATUS_COLORS[patient.status]}
          sx={{ textTransform: 'capitalize' }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PersonalInfoCard patient={patient} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MedicalInfoCard patient={patient} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RecordInfoCard patient={patient} />
        </Grid>
      </Grid>
    </>
  );
}
