import { Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Patient Detail
      </Typography>
      <Typography color="text.secondary">
        Details for patient {id} coming soon.
      </Typography>
    </>
  );
}
