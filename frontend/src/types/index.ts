export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  blood_type: string | null;
  allergies: string[];
  conditions: string[];
  status: PatientStatus;
  last_visit_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type PatientStatus = 'active' | 'inactive' | 'critical';

export type SortableColumn = 'last_name' | 'date_of_birth' | 'status' | 'last_visit_date';

export interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  blood_type: string;
  allergies: string[];
  conditions: string[];
  status: PatientStatus;
  last_visit_date: string;
}

export interface PatientListParams {
  limit?: number;
  offset?: number;
  search?: string;
  status?: PatientStatus;
  sort_by?: SortableColumn;
  sort_order?: 'asc' | 'desc';
}

export interface Note {
  id: string;
  patient_id: string;
  content: string;
  timestamp: string;
  created_at: string;
}

export interface NoteFormData {
  content: string;
  timestamp: string;
}
