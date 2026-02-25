const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDate(dateString: string | null): string {
  if (!dateString) return '\u2014';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '\u2014';
  return dateFormatter.format(date);
}
