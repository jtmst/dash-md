import axios from 'axios';
import type { PaginatedResponse, Patient, PatientFormData, PatientListParams } from '../types/index.ts';

const client = axios.create({
  baseURL: '/api',
});

client.interceptors.response.use((response) => response.data);

export function getPatients(params: PatientListParams): Promise<PaginatedResponse<Patient>> {
  return client.get('/patients', { params });
}

export function getPatient(id: string): Promise<Patient> {
  return client.get(`/patients/${id}`);
}

function transformFormData(data: PatientFormData) {
  return {
    ...data,
    blood_type: data.blood_type || null,
    last_visit_date: data.last_visit_date || null,
  };
}

export function createPatient(data: PatientFormData): Promise<Patient> {
  return client.post('/patients', transformFormData(data));
}

export function updatePatient(id: string, data: PatientFormData): Promise<Patient> {
  return client.put(`/patients/${id}`, transformFormData(data));
}

export function deletePatient(id: string): Promise<void> {
  return client.delete(`/patients/${id}`);
}
