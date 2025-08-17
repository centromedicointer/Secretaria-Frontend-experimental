
import { formatInTimeZone } from 'date-fns-tz';

const MEXICO_TIMEZONE = 'America/Mexico_City';

export const formatDateInMexicoTime = (date: string | Date, format: string = 'dd/MM/yyyy HH:mm:ss') => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Manejar diferentes formatos de fecha que pueden venir de Supabase
      if (date.includes('T')) {
        // Formato ISO con T (ej: "2025-08-15T18:00:00+00:00" o "2025-08-15T18:00:00")
        dateObj = new Date(date);
      } else if (date.includes(' ')) {
        // Formato con espacio (ej: "2025-08-15 18:00:00")
        dateObj = new Date(date.replace(' ', 'T'));
      } else {
        // Solo fecha (ej: "2025-08-15")
        dateObj = new Date(date + 'T00:00:00');
      }
    } else {
      dateObj = date;
    }
    
    // Verificar que la fecha sea válida
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return 'Fecha inválida';
    }
    
    return formatInTimeZone(dateObj, MEXICO_TIMEZONE, format);
  } catch (error) {
    console.error('Error formatting date:', error, 'Date:', date);
    return `Error: ${String(date)}`;
  }
};

export const formatTimeInMexicoTime = (date: string | Date) => {
  return formatDateInMexicoTime(date, 'HH:mm:ss');
};

export const formatDateTimeInMexicoTime = (date: string | Date) => {
  return formatDateInMexicoTime(date, 'dd/MM/yyyy HH:mm');
};
