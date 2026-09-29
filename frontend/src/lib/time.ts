/**
 * Utility functions for 12-hour / 24-hour prayer and Jamaat time formatting.
 */

/**
 * Formats a 24-hour or raw time string (e.g., "13:30", "05:15", "16:45")
 * into a human-friendly 12-hour format with AM/PM (e.g., "1:30 PM", "5:15 AM", "4:45 PM").
 *
 * Handles existing 12-hour strings, prefixes like "2nd: 14:15", and empty/null states.
 */
export function formatTo12Hour(time?: string | null, fallback: string = '—'): string {
  if (!time || !time.trim()) return fallback;
  const trimmed = time.trim();

  // If already formatted like "1:30 PM", "05:15 AM", "1:30pm"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (ampmMatch) {
    const h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    return `${h}:${m} ${period}`;
  }

  // Handle prefix like "2nd: 14:15"
  if (trimmed.toLowerCase().startsWith('2nd:')) {
    const rest = trimmed.slice(4).trim();
    return `2nd: ${formatTo12Hour(rest, rest)}`;
  }

  // Standard 24-hour "HH:mm" or "H:mm"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours24 = parseInt(match24[1], 10);
    const minutes = match24[2];
    if (hours24 >= 0 && hours24 <= 23) {
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      return `${hours12}:${minutes} ${period}`;
    }
  }

  return trimmed;
}

/**
 * Converts a 12-hour (e.g., "1:30 PM", "05:15 AM") or 24-hour string
 * into a normalized 24-hour "HH:mm" string for API storage.
 */
export function convertTo24Hour(timeStr?: string | null): string {
  if (!timeStr || !timeStr.trim()) return '';
  const trimmed = timeStr.trim();

  // Handle 12-hour format with AM/PM
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2];
    const period = match12[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // Handle 24-hour format "H:mm" or "HH:mm"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = match24[2];
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }

  return trimmed;
}
