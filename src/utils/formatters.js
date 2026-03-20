/**
 * Format and validate student IDs
 * Accepted format: XX-XXXXX-XXX (10 digits, hyphens optional)
 */
export function formatStudentId(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 10) throw new Error('ID must contain exactly 10 digits.');
  return `${digits.slice(0, 2)}-${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validateStudentId(input) {
  return input.replace(/\D/g, '').length === 10;
}

/** Format a Date to time string (12-hr, en-PH locale) */
export function fmtTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/** Format a Date to short date string (en-PH locale) */
export function fmtDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Human-readable duration between two timestamps */
export function duration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 'Active';
  const mins = Math.round((new Date(checkOut) - new Date(checkIn)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
