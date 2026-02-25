import axios from 'axios';
import type { PaginatedResponse, Patient, PatientListParams } from '../types/index.ts';

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
