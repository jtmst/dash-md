import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { usePatients } from '../hooks/usePatients.ts';
import { formatDate } from '../utils/format.ts';
import type { PatientStatus } from '../types/index.ts';

const STATUS_COLORS = {
  active: 'success',
  inactive: 'warning',
  critical: 'error',
} as const;

type StatKey = 'total' | PatientStatus;

const STAT_CARDS: {
  key: StatKey;
  label: string;
  color: string;
  icon: typeof PeopleIcon;
  path: string;
}[] = [
  { key: 'total', label: 'Total Patients', color: '#1976d2', icon: PeopleIcon, path: '/patients' },
  {
    key: 'active',
    label: 'Active',
    color: '#2e7d32',
    icon: CheckCircleIcon,
    path: '/patients?status=active',
  },
  {
    key: 'critical',
    label: 'Critical',
    color: '#d32f2f',
    icon: ErrorIcon,
    path: '/patients?status=critical',
  },
  {
    key: 'inactive',
    label: 'Inactive',
    color: '#ed6c02',
    icon: WarningIcon,
    path: '/patients?status=inactive',
  },
];

function StatCard({
  label,
  count,
  color,
  icon: Icon,
  isLoading,
  isError,
  onClick,
}: {
  label: string;
  count: number | undefined;
  color: string;
  icon: typeof PeopleIcon;
  isLoading: boolean;
  isError: boolean;
  onClick: () => void;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              bgcolor: `${color}14`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 32, color }} />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {isLoading ? (
              <Skeleton width={48} height={40} />
            ) : isError ? (
              <Typography variant="h4" color="error">
                --
              </Typography>
            ) : (
              <Typography variant="h4" fontWeight={600}>
                {count}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const statQueries: Record<StatKey, ReturnType<typeof usePatients>> = {
    total: usePatients({ limit: 1 }),
    active: usePatients({ limit: 1, status: 'active' }),
    critical: usePatients({ limit: 1, status: 'critical' }),
    inactive: usePatients({ limit: 1, status: 'inactive' }),
  };
  const recentQuery = usePatients({ limit: 5, sort_by: 'last_visit_date', sort_order: 'desc' });

  const statQueryList = Object.values(statQueries);
  const anyStatError = statQueryList.some((q) => q.isError);
  const anyStatLoading = statQueryList.some((q) => q.isLoading);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={isMobile ? undefined : <AddIcon />}
          onClick={() => navigate('/patients/new')}
        >
          {isMobile ? <AddIcon /> : 'New Patient'}
        </Button>
      </Box>

      {/* Stat Cards */}
      {anyStatError && !anyStatLoading && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => statQueryList.forEach((q) => q.refetch())}
            >
              Retry
            </Button>
          }
        >
          Failed to load patient statistics
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {STAT_CARDS.map((card) => {
          const query = statQueries[card.key];
          return (
            <Grid key={card.key} size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label={card.label}
                count={query.data?.total}
                color={card.color}
                icon={card.icon}
                isLoading={query.isLoading}
                isError={query.isError}
                onClick={() => navigate(card.path)}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Recent Patients */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Recent Patients</Typography>
      </Box>

      {recentQuery.isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => recentQuery.refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load recent patients
        </Alert>
      )}

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <TableContainer>
          {recentQuery.isLoading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
              ))}
            </Box>
          ) : recentQuery.data && recentQuery.data.items.length > 0 ? (
            <Table aria-label="Recent patients" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Visit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentQuery.data.items.map((patient) => (
                  <TableRow
                    key={patient.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <TableCell>
                      {patient.last_name}, {patient.first_name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={patient.status}
                        color={STATUS_COLORS[patient.status]}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(patient.last_visit_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !recentQuery.isError && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">No recent patients</Typography>
              </Box>
            )
          )}
        </TableContainer>
      </Paper>

      <Button endIcon={<ArrowForwardIcon />} onClick={() => navigate('/patients')}>
        View All Patients
      </Button>
    </>
  );
}
