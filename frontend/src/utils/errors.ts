import { isAxiosError } from 'axios';

export function parseApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (err.response?.status === 422 && data?.detail) {
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((d: { loc?: string[]; msg: string }) => {
            const field = d.loc?.slice(-1)[0];
            return field ? `${field}: ${d.msg}` : d.msg;
          })
          .join('; ');
      }
      if (typeof data.detail === 'string') return data.detail;
    }
    if (data?.detail && typeof data.detail === 'string') return data.detail;
  }
  return 'An unexpected error occurred. Please try again.';
}
