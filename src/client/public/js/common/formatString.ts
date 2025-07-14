/**
 * Formats a template string by replacing date placeholders with current date/time values.
 * 
 * Supports the following date format patterns:
 * - yyyy: Full year (2025)
 * - yy: Last two digits of the year (25)
 * - y: Full year without leading zeros (2025)
 * - MM: Month with leading zero (01-12)
 * - M: Month without leading zero (1-12)
 * - dd: Day with leading zero (01-31)
 * - d: Day without leading zero (1-31)
 * - HH: 24-hour format with leading zero (00-23)
 * - H: 24-hour format without leading zero (0-23)
 * - hh: 12-hour format with leading zero (01-12)
 * - h: 12-hour format without leading zero (1-12)
 * - mm: Minutes with leading zero (00-59)
 * - m: Minutes without leading zero (0-59)
 * - ss: Seconds with leading zero (00-59)
 * - s: Seconds without leading zero (0-59)
 * - A: AM/PM uppercase
 * - a: AM/PM lowercase
 * 
 * Usage: formatDate("My file %date:yyyy-MM-dd_HH-mm-ss%.txt")
 * Result: "My file 2025-01-15_14-30-45.txt"
 * 
 * @param template The template string containing %date:format% placeholders
 * @returns The formatted string with date placeholders replaced
 */
export function formatDate(template: string): string {
    const now = new Date();
    
    const replacements = {
        'yyyy': String(now.getFullYear()),  // Full year (2025)
        'yy': String(now.getFullYear()).slice(-2),  // Last two digits of the year (25)
        'y': String(now.getFullYear()), // Full year, but no leading zeros (2025)
        
        'MM': String(now.getMonth() + 1).padStart(2, '0'), // Month (01-12)
        'M': String(now.getMonth() + 1), // Month without leading zero (1-12)
        
        'dd': String(now.getDate()).padStart(2, '0'), // Day of the month (01-31)
        'd': String(now.getDate()), // Day without leading zero (1-31)

        'HH': String(now.getHours()).padStart(2, '0'), // 24-hour format (00-23)
        'H': String(now.getHours()), // 24-hour without leading zero (0-23)

        'hh': String(now.getHours() % 12 || 12).padStart(2, '0'), // 12-hour format (01-12)
        'h': String(now.getHours() % 12 || 12), // 12-hour without leading zero (1-12)

        'mm': String(now.getMinutes()).padStart(2, '0'), // Minutes (00-59)
        'm': String(now.getMinutes()), // Minutes without leading zero (0-59)

        'ss': String(now.getSeconds()).padStart(2, '0'), // Seconds (00-59)
        's': String(now.getSeconds()), // Seconds without leading zero (0-59)

        'A': now.getHours() >= 12 ? 'PM' : 'AM', // AM/PM uppercase
        'a': now.getHours() >= 12 ? 'pm' : 'am', // AM/PM lowercase
    };

    return template.replace(/%date:([^%]+)%/g, (_, format: string) => {
        return format.replace(/yyyy|yy|y|MM|M|dd|d|HH|H|hh|h|mm|m|ss|s|A|a/g, (match: string) => replacements[match as keyof typeof replacements]);
    });
} 