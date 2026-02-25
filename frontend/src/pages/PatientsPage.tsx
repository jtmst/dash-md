import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { usePatients } from '../hooks/usePatients.ts';
import { formatDate } from '../utils/format.ts';
import type { PatientListParams, PatientStatus, SortableColumn } from '../types/index.ts';

const STATUS_COLORS = {
  active: 'success',
  inactive: 'warning',
  critical: 'error',
} as const;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function PatientsPage() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortableColumn>('last_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const params: PatientListParams = useMemo(
    () => ({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search: debouncedSearch || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [rowsPerPage, page, debouncedSearch, statusFilter, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = usePatients(params);

  const handleSort = (column: SortableColumn) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(0);
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value as PatientStatus | 'all');
    setPage(0);
  };

  const hasFilters = !!debouncedSearch || statusFilter !== 'all';

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Patients
      </Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          aria-label="Search patients"
          placeholder="Search patients..."
          size="small"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(0);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
            htmlInput: { maxLength: 200 },
          }}
          sx={{ minWidth: 280 }}
        />
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={handleStatusChange}
          size="small"
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
        </Select>
      </Box>

      {/* Error state */}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {error instanceof Error ? error.message : 'Failed to load patients'}
        </Alert>
      )}

      {/* Table */}
      <Paper variant="outlined">
        {/* Refetch indicator — only shown when refetching with existing data */}
        {isFetching && !isLoading && <LinearProgress />}

        <TableContainer>
          {/* Initial loading spinner */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : data && data.items.length > 0 ? (
            <Table aria-label="Patient list">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'last_name'}
                      direction={sortBy === 'last_name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('last_name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'date_of_birth'}
                      direction={sortBy === 'date_of_birth' ? sortOrder : 'asc'}
                      onClick={() => handleSort('date_of_birth')}
                    >
                      Date of Birth
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'status'}
                      direction={sortBy === 'status' ? sortOrder : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'last_visit_date'}
                      direction={sortBy === 'last_visit_date' ? sortOrder : 'asc'}
                      onClick={() => handleSort('last_visit_date')}
                    >
                      Last Visit
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((patient) => (
                  <TableRow
                    key={patient.id}
                    hover
                    aria-label={`${patient.last_name}, ${patient.first_name}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <TableCell>
                      {patient.last_name}, {patient.first_name}
                    </TableCell>
                    <TableCell>{formatDate(patient.date_of_birth)}</TableCell>
                    <TableCell>
                      <Chip
                        label={patient.status}
                        color={STATUS_COLORS[patient.status]}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(patient.last_visit_date)}</TableCell>
                    <TableCell>
                      <Button
                        aria-label={`View ${patient.last_name}, ${patient.first_name}`}
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !isError && (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {hasFilters
                    ? 'No patients match your search'
                    : 'No patients found'}
                </Typography>
              </Box>
            )
          )}
        </TableContainer>

        {data && data.total > 0 && (
          <TablePagination
            component="div"
            count={data.total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        )}
      </Paper>
    </>
  );
}
