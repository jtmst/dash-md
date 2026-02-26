import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import type { Patient, PatientFormData, PatientStatus } from '../types/index.ts';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUSES: PatientStatus[] = ['active', 'inactive', 'critical'];

interface PatientFormProps {
  initialData?: Patient;
  onSubmit: (data: PatientFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  serverError?: string | null;
}

interface FormErrors {
  [key: string]: string;
}

function parseCommaSeparated(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function validate(fields: PatientFormData): FormErrors {
  const errors: FormErrors = {};

  if (!fields.first_name.trim()) errors.first_name = 'First name is required';
  else if (fields.first_name.length > 100) errors.first_name = 'Max 100 characters';

  if (!fields.last_name.trim()) errors.last_name = 'Last name is required';
  else if (fields.last_name.length > 100) errors.last_name = 'Max 100 characters';

  if (!fields.date_of_birth) {
    errors.date_of_birth = 'Date of birth is required';
  } else if (new Date(fields.date_of_birth) >= new Date(new Date().toISOString().split('T')[0])) {
    errors.date_of_birth = 'Date of birth must be in the past';
  }

  if (!fields.gender.trim()) errors.gender = 'Gender is required';

  if (!fields.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Invalid email format';
  }

  if (!fields.phone.trim()) errors.phone = 'Phone is required';
  else if (fields.phone.length > 20) errors.phone = 'Max 20 characters';

  if (!fields.address.trim()) errors.address = 'Address is required';
  else if (fields.address.length > 500) errors.address = 'Max 500 characters';

  return errors;
}

export default function PatientForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  serverError,
}: PatientFormProps) {
  const isEdit = !!initialData;

  const [fields, setFields] = useState<PatientFormData>({
    first_name: initialData?.first_name ?? '',
    last_name: initialData?.last_name ?? '',
    date_of_birth: initialData?.date_of_birth ?? '',
    gender: initialData?.gender ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    address: initialData?.address ?? '',
    blood_type: initialData?.blood_type ?? '',
    allergies: initialData?.allergies ?? [],
    conditions: initialData?.conditions ?? [],
    status: initialData?.status ?? 'active',
    last_visit_date: initialData?.last_visit_date ?? '',
  });

  const [allergiesText, setAllergiesText] = useState(
    initialData?.allergies?.join(', ') ?? '',
  );
  const [conditionsText, setConditionsText] = useState(
    initialData?.conditions?.join(', ') ?? '',
  );

  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = (name: keyof PatientFormData, value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: PatientFormData = {
      ...fields,
      first_name: fields.first_name.trim(),
      last_name: fields.last_name.trim(),
      date_of_birth: fields.date_of_birth,
      gender: fields.gender.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      address: fields.address.trim(),
      allergies: parseCommaSeparated(allergiesText),
      conditions: parseCommaSeparated(conditionsText),
    };

    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {serverError}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Personal Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
            <TextField
              label="First Name"
              required
              value={fields.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              error={!!errors.first_name}
              helperText={errors.first_name}
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              label="Last Name"
              required
              value={fields.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              error={!!errors.last_name}
              helperText={errors.last_name}
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              label="Date of Birth"
              type="date"
              required
              value={fields.date_of_birth}
              onChange={(e) => updateField('date_of_birth', e.target.value)}
              error={!!errors.date_of_birth}
              helperText={errors.date_of_birth}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Gender"
              required
              value={fields.gender}
              onChange={(e) => updateField('gender', e.target.value)}
              error={!!errors.gender}
              helperText={errors.gender}
              slotProps={{ htmlInput: { maxLength: 50 } }}
            />
            <TextField
              label="Email"
              type="email"
              required
              value={fields.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              slotProps={{ htmlInput: { maxLength: 254 } }}
            />
            <TextField
              label="Phone"
              required
              value={fields.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              slotProps={{ htmlInput: { maxLength: 20 } }}
            />
            <TextField
              label="Address"
              required
              multiline
              rows={2}
              value={fields.address}
              onChange={(e) => updateField('address', e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
              slotProps={{ htmlInput: { maxLength: 500 } }}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Medical Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
            <TextField
              label="Blood Type"
              select
              value={fields.blood_type}
              onChange={(e) => updateField('blood_type', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {BLOOD_TYPES.map((bt) => (
                <MenuItem key={bt} value={bt}>{bt}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Status"
              select
              value={fields.status}
              onChange={(e) => updateField('status', e.target.value as PatientStatus)}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Allergies"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              helperText="Comma-separated"
            />
            <TextField
              label="Conditions"
              value={conditionsText}
              onChange={(e) => setConditionsText(e.target.value)}
              helperText="Comma-separated"
            />
            <TextField
              label="Last Visit Date"
              type="date"
              value={fields.last_visit_date}
              onChange={(e) => updateField('last_visit_date', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
        >
          {isEdit ? 'Save' : 'Create Patient'}
        </Button>
      </Box>
    </Box>
  );
}
