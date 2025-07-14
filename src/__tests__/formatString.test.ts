import { formatDate } from '../client/public/js/common/formatString';

describe('formatString', () => {
  describe('formatDate', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    function setMockDate(dateString: string) {
      // Use local time string (no 'Z') for correct local time interpretation
      const mockDate = new Date(dateString);
      jest.setSystemTime(mockDate);
      return mockDate;
    }

    describe('year formatting', () => {
      beforeEach(() => {
        setMockDate('2025-01-15T14:30:45');
      });

      it('should format full year (yyyy)', () => {
        const result = formatDate('Year: %date:yyyy%');
        expect(result).toBe('Year: 2025');
      });

      it('should format two-digit year (yy)', () => {
        const result = formatDate('Year: %date:yy%');
        expect(result).toBe('Year: 25');
      });

      it('should format year without leading zeros (y)', () => {
        const result = formatDate('Year: %date:y%');
        expect(result).toBe('Year: 2025');
      });
    });

    describe('month formatting', () => {
      it('should format month with leading zero (MM)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Month: %date:MM%');
        expect(result).toBe('Month: 01');
      });

      it('should format month without leading zero (M)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Month: %date:M%');
        expect(result).toBe('Month: 1');
      });

      it('should handle double-digit months correctly', () => {
        // Mock December
        setMockDate('2025-12-15T14:30:45');
        
        const result = formatDate('Month: %date:MM% and %date:M%');
        expect(result).toBe('Month: 12 and 12');
      });
    });

    describe('day formatting', () => {
      it('should format day with leading zero (dd)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Day: %date:dd%');
        expect(result).toBe('Day: 15');
      });

      it('should format day without leading zero (d)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Day: %date:d%');
        expect(result).toBe('Day: 15');
      });

      it('should handle single-digit days correctly', () => {
        // Mock January 5th
        setMockDate('2025-01-05T14:30:45');
        
        const result = formatDate('Day: %date:dd% and %date:d%');
        expect(result).toBe('Day: 05 and 5');
      });
    });

    describe('hour formatting', () => {
      it('should format 24-hour with leading zero (HH)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Hour 24: %date:HH%');
        expect(result).toBe('Hour 24: 14');
      });

      it('should format 24-hour without leading zero (H)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Hour 24: %date:H%');
        expect(result).toBe('Hour 24: 14');
      });

      it('should format 12-hour with leading zero (hh)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Hour 12: %date:hh%');
        expect(result).toBe('Hour 12: 02');
      });

      it('should format 12-hour without leading zero (h)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Hour 12: %date:h%');
        expect(result).toBe('Hour 12: 2');
      });

      it('should handle midnight correctly', () => {
        // Mock midnight
        setMockDate('2025-01-15T00:30:45');
        
        const result = formatDate('Time: %date:HH%:%date:mm% (%date:hh%:%date:mm% %date:A%)');
        expect(result).toBe('Time: 00:30 (12:30 AM)');
      });

      it('should handle noon correctly', () => {
        // Mock noon
        setMockDate('2025-01-15T12:30:45');
        
        const result = formatDate('Time: %date:HH%:%date:mm% (%date:hh%:%date:mm% %date:A%)');
        expect(result).toBe('Time: 12:30 (12:30 PM)');
      });

      it('should handle PM hours correctly', () => {
        // Mock 3 PM
        setMockDate('2025-01-15T15:30:45');
        
        const result = formatDate('Time: %date:HH%:%date:mm% (%date:hh%:%date:mm% %date:A%)');
        expect(result).toBe('Time: 15:30 (03:30 PM)');
      });
    });

    describe('minute formatting', () => {
      it('should format minutes with leading zero (mm)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Minute: %date:mm%');
        expect(result).toBe('Minute: 30');
      });

      it('should format minutes without leading zero (m)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Minute: %date:m%');
        expect(result).toBe('Minute: 30');
      });

      it('should handle single-digit minutes correctly', () => {
        // Mock 14:05:45
        setMockDate('2025-01-15T14:05:45');
        
        const result = formatDate('Minute: %date:mm% and %date:m%');
        expect(result).toBe('Minute: 05 and 5');
      });
    });

    describe('second formatting', () => {
      it('should format seconds with leading zero (ss)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Second: %date:ss%');
        expect(result).toBe('Second: 45');
      });

      it('should format seconds without leading zero (s)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Second: %date:s%');
        expect(result).toBe('Second: 45');
      });

      it('should handle single-digit seconds correctly', () => {
        // Mock 14:30:05
        setMockDate('2025-01-15T14:30:05');
        
        const result = formatDate('Second: %date:ss% and %date:s%');
        expect(result).toBe('Second: 05 and 5');
      });
    });

    describe('AM/PM formatting', () => {
      it('should format AM uppercase (A)', () => {
        // Mock 9 AM
        setMockDate('2025-01-15T09:30:45');
        
        const result = formatDate('Period: %date:A%');
        expect(result).toBe('Period: AM');
      });

      it('should format PM uppercase (A)', () => {
        // Mock 3 PM
        setMockDate('2025-01-15T15:30:45');
        
        const result = formatDate('Period: %date:A%');
        expect(result).toBe('Period: PM');
      });

      it('should format AM lowercase (a)', () => {
        // Mock 9 AM
        setMockDate('2025-01-15T09:30:45');
        
        const result = formatDate('Period: %date:a%');
        expect(result).toBe('Period: am');
      });

      it('should format PM lowercase (a)', () => {
        // Mock 3 PM
        setMockDate('2025-01-15T15:30:45');
        
        const result = formatDate('Period: %date:a%');
        expect(result).toBe('Period: pm');
      });
    });

    describe('complex format combinations', () => {
      it('should handle multiple date placeholders in one string', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('File_%date:yyyy-MM-dd%_%date:HH-mm-ss%.txt');
        expect(result).toBe('File_2025-01-15_14-30-45.txt');
      });

      it('should handle mixed date formats with text', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Backup created on %date:MM/dd/yyyy% at %date:hh:mm A%');
        expect(result).toBe('Backup created on 01/15/2025 at 02:30 PM');
      });

      it('should handle ISO-like format', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('%date:yyyy-MM-ddTHH:mm:ss%');
        expect(result).toBe('2025-01-15T14:30:45');
      });

      it('should handle custom separator formats', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('%date:yyyy.MM.dd_HH.mm.ss%');
        expect(result).toBe('2025.01.15_14.30.45');
      });
    });

    describe('edge cases', () => {
      it('should return original string when no date placeholders are present', () => {
        const template = 'This is a regular string without date formatting';
        const result = formatDate(template);
        expect(result).toBe(template);
      });

      it('should handle empty string', () => {
        const result = formatDate('');
        expect(result).toBe('');
      });

      it('should handle string with only date placeholder', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('%date:yyyy%');
        expect(result).toBe('2025');
      });

      it('should handle malformed date placeholder (missing closing %)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Test %date:yyyy');
        expect(result).toBe('Test %date:yyyy');
      });

      it('should handle malformed date placeholder (empty format)', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Test %date:%');
        expect(result).toBe('Test %date:%');
      });

      it('should handle unknown format characters', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Test %date:yyyy-XX-dd%');
        expect(result).toBe('Test 2025-XX-15');
      });

      it('should handle multiple consecutive placeholders', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('%date:yyyy%%date:MM%%date:dd%');
        expect(result).toBe('20250115');
      });
    });

    describe('real-world usage examples', () => {
      it('should format filename with timestamp', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('screenshot_%date:yyyy-MM-dd_HH-mm-ss%.png');
        expect(result).toBe('screenshot_2025-01-15_14-30-45.png');
      });

      it('should format log entry timestamp', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('[%date:yyyy-MM-dd HH:mm:ss%] INFO: Application started');
        expect(result).toBe('[2025-01-15 14:30:45] INFO: Application started');
      });

      it('should format user-friendly date', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('Created on %date:MM dd, yyyy% at %date:hh:mm A%');
        expect(result).toBe('Created on 01 15, 2025 at 02:30 PM');
      });

      it('should format database timestamp', () => {
        setMockDate('2025-01-15T14:30:45');
        const result = formatDate('%date:yyyy-MM-ddTHH:mm:ss%Z');
        expect(result).toBe('2025-01-15T14:30:45Z');
      });
    });
  });
}); 