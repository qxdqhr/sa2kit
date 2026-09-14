export interface ColorScheme {
  background: string;
  border: string;
  borderColor: string;
  text: string;
  lightBackground: string;
}

export interface HolidayColorSchemes {
  work: ColorScheme;
  personal: ColorScheme;
  other: ColorScheme;
}

export const holidayColors: HolidayColorSchemes = {
  work: {
    background: '#fef2f2',
    border: '#fecaca',
    borderColor: '#ef4444',
    text: '#ef4444',
    lightBackground: 'rgba(239, 68, 68, 0.1)',
  },
  personal: {
    background: '#f0f9ff',
    border: '#bae6fd',
    borderColor: '#0284c7',
    text: '#0284c7',
    lightBackground: 'rgba(2, 132, 199, 0.1)',
  },
  other: {
    background: '#fefce8',
    border: '#fef08a', 
    borderColor: '#ca8a04',
    text: '#ca8a04',
    lightBackground: 'rgba(202, 138, 4, 0.1)',
  },
}; 