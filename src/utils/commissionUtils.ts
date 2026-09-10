import { Barber, Service, Appointment } from '../models';

export interface CommissionResult {
  commission_rate: number; // 55, 70, or 0
  commission_amount: number; // Euro value
  is_owner: boolean;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  day_name: string;
}

/**
 * Checks if a barber is the owner/proprietor of the barbershop.
 * Proprietors (such as Roger in Roger'X BarberShop) do NOT receive commission.
 * The establishment retains 100% of the service revenue.
 */
export function isBarberOwner(barber: Barber | undefined | null): boolean {
  if (!barber) return false;
  if ((barber as any).isOwner === true) return true;

  const id = (barber.id || '').toLowerCase();
  const name = (barber.name || '').toLowerCase();

  // Roger is the founder and owner of Roger'X
  if (id === 'b-rogerx-roger' || id === 'acc-owner-rogerx') return true;
  if (name === 'roger' || name.startsWith("roger ") || name.includes("(dono")) {
    // Make sure we don't accidentally match "Barbudo"
    if (!name.includes('barbudo')) {
      return true;
    }
  }

  // General demo owner accounts
  if (id.includes('owner') || name.includes('dono') || name.includes('proprietário')) {
    return true;
  }

  return false;
}

/**
 * Calculates barber commission dynamically based on day of week:
 * - Monday to Saturday: 55% of service price
 * - Sunday (when open): 70% of service price
 * - Owner/Proprietor: 0% (retained in full by barbershop)
 */
export function calculateBarberCommission(
  servicePrice: number,
  appointmentDate: string, // YYYY-MM-DD
  barber: Barber | undefined | null
): CommissionResult {
  const dayNames = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];

  // Safely parse date without timezone shift
  let dayOfWeek = 1; // Default to Monday
  try {
    if (appointmentDate && appointmentDate.includes('-')) {
      const [y, m, d] = appointmentDate.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      dayOfWeek = dt.getDay();
    } else {
      dayOfWeek = new Date().getDay();
    }
  } catch {
    dayOfWeek = new Date().getDay();
  }

  const isOwner = isBarberOwner(barber);

  if (isOwner) {
    return {
      commission_rate: 0,
      commission_amount: 0,
      is_owner: true,
      day_of_week: dayOfWeek,
      day_name: `${dayNames[dayOfWeek]} (Dono / Sem Comissão)`
    };
  }

  // Contracted barbers:
  // Sunday = 70%, Monday-Saturday = 55%
  const isSunday = dayOfWeek === 0;
  const commission_rate = isSunday ? 70 : 55;
  const rawCommission = (servicePrice * commission_rate) / 100;
  const commission_amount = parseFloat(rawCommission.toFixed(2));

  return {
    commission_rate,
    commission_amount,
    is_owner: false,
    day_of_week: dayOfWeek,
    day_name: dayNames[dayOfWeek]
  };
}
