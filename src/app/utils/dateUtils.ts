
export const getDaysInMonth = (year: number, month: number): string[] => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return day < 10 ? `0${day}` : `${day}`;
    });
  };
  
  export const isWeekend = (year: number, month: number, day: number): boolean => {
    const date = new Date(year, month, day);
    const weekday = date.getDay();
    return weekday === 0 || weekday === 6;
  };

export const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const isHoliday = (year: number, month: number, day: number, holiday: string): boolean => {
  const date = new Date(year, month, day);
  const holidayDate = parseDateString(holiday);
  return (
    date.getFullYear() === holidayDate.getFullYear() &&
    date.getMonth() === holidayDate.getMonth() &&
    date.getDate() === holidayDate.getDate()
  );
};

/**
 * 
 * @param input, which is date string or date object
 * @returns A date object corresponding 1st day of that month
 */
export function getStartOfMonth(input: Date | string ):Date {
  const date = (input instanceof Date) ? input : new Date(input)
  const startOfMonth = new Date(date)
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  return startOfMonth
}

/**
 * 
 * @param input, which is date string or date object
 * @returns A date object corresponding last day of that month
 */
export function getEndOfMonth(input: Date | string):Date {
  const date = (input instanceof Date) ? input : new Date(input)
  const endOfMonth = new Date(date)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)
  endOfMonth.setDate(0)
  endOfMonth.setHours(23, 59, 59, 999)
  return endOfMonth
}


export function getBusinessDays(
  startDate: Date,
  endDate: Date,
  holidays: string[] = []
): number {
  if (endDate < startDate) return 0;

  // Work with UTC dates to avoid timezone issues
  const start = new Date(Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate()
  ));
  
  const end = new Date(Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate()
  ));

  // Calculate total days (including both start and end dates)
  const millisecondsPerDay = 86400 * 1000;
  const diff = end.getTime() - start.getTime();
  let days = Math.floor(diff / millisecondsPerDay) + 1; // +1 to include both start and end

  // Calculate full weeks and subtract weekend days
  const weeks = Math.floor(days / 7);
  days = days - (weeks * 2);

  // Handle partial weeks
  const startDay = start.getUTCDay();
  const endDay = end.getUTCDay();

  // Remove weekend days not previously removed
  if (startDay - endDay > 1) {
    days = days - 2;
  }

  // Remove start day if it's Sunday
  if (startDay === 0 && endDay !== 6) {
    days = days - 1;
  }

  // Remove end day if it's Saturday
  if (endDay === 6 && startDay !== 0) {
    days = days - 1;
  }

  // Subtract holidays that fall on business days
  const holidaySet = new Set(holidays);
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getUTCDay();
    const dateString = current.toISOString().split('T')[0];
    
    // Only count holidays on weekdays (Monday-Friday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && holidaySet.has(dateString)) {
      days--;
    }
    
    // Use UTC date manipulation to avoid timezone shifts
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return Math.max(0, days);
}


