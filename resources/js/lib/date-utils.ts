/**
 * Timezone utility functions for handling UTC storage with local display
 */

/**
 * Format a UTC datetime string to user's local timezone
 * @param utcDateString - ISO 8601 datetime string from server
 * @param options - Intl.DateTimeFormatOptions for customization
 */
export function formatLocalDateTime(
    utcDateString: string | null,
    options?: Intl.DateTimeFormatOptions
): string {
    if (!utcDateString) return '';

    const date = new Date(utcDateString);
    return date.toLocaleString(undefined, options);
}

/**
 * Format date only in user's local timezone
 * @param utcDateString - ISO 8601 datetime string from server
 */
export function formatLocalDate(utcDateString: string | null): string {
    if (!utcDateString) return '';

    const date = new Date(utcDateString);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format time only in user's local timezone
 * @param utcDateString - ISO 8601 datetime string from server
 */
export function formatLocalTime(utcDateString: string | null): string {
    if (!utcDateString) return '';

    const date = new Date(utcDateString);
    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format datetime for display with both date and time
 * @param utcDateString - ISO 8601 datetime string from server
 */
export function formatLocalDateTimeFull(utcDateString: string | null): string {
    if (!utcDateString) return '';

    const date = new Date(utcDateString);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Convert local datetime-local input value to UTC ISO string for server
 * @param localDateTimeString - Value from datetime-local input
 */
export function localToUTC(localDateTimeString: string | null): string | null {
    if (!localDateTimeString) return null;

    const date = new Date(localDateTimeString);
    return date.toISOString();
}

/**
 * Convert UTC ISO string to local datetime-local input value
 * @param utcDateString - ISO 8601 datetime string from server
 */
export function utcToLocalInput(utcDateString: string | null): string {
    if (!utcDateString) return '';

    const date = new Date(utcDateString);
    // Format: YYYY-MM-DDTHH:mm (required for datetime-local input)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get user's timezone name (e.g., "Africa/Nairobi", "America/New_York")
 */
export function getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get user's timezone offset in hours (e.g., +3, -5)
 */
export function getTimezoneOffset(): number {
    return -new Date().getTimezoneOffset() / 60;
}

/**
 * Calculate duration between two dates in a human-readable format
 * @param startDate - Start datetime string
 * @param endDate - End datetime string
 */
export function calculateDuration(startDate: string | null, endDate: string | null): string {
    if (!startDate || !endDate) return 'N/A';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

/**
 * Format just the time portion (HH:MM AM/PM)
 */
export function formatLocalTimeOnly(utcDateString: string | null): string {
    if (!utcDateString) return '';

    const date = new Date(utcDateString);
    return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
