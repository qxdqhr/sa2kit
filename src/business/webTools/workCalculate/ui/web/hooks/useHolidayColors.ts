import { HolidayType } from '../../../domain';
import { holidayColors, type ColorScheme } from '../../../domain/config/colors';

export const useHolidayColors = () => {
  const getColorScheme = (type: HolidayType): ColorScheme => {
    return holidayColors[type];
  };

  const getHolidayStyles = (type: HolidayType) => {
    const colors = getColorScheme(type);
    return {
      tag: {
        backgroundColor: colors.background,
        borderColor: colors.border,
        color: colors.text,
      },
      select: {
        color: colors.text,
      },
      input: {
        color: colors.text,
      },
      date: {
        backgroundColor: colors.lightBackground,
        color: colors.text,
      },
      indicator: {
        backgroundColor: colors.text,
        color: '#ffffff',
      },
      cell: {
        backgroundColor: colors.background,
        borderColor: colors.border,
      },
      cellAssigned: {
        backgroundColor: colors.lightBackground,
      },
    };
  };

  return {
    getColorScheme,
    getHolidayStyles,
  };
}; 