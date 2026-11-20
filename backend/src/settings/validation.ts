import { InputError } from '../supplies/validation.js';

/** Valida el valor monetario de una hora sin convertir textos enviados por el cliente. */
export function validateHourlyRate(body: unknown): number {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Enviá la configuración de costos.');
  const { hourlyRate } = body as Record<string, unknown>;
  if (typeof hourlyRate !== 'number' || !Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new InputError('El valor de la hora debe ser mayor que cero.');
  return hourlyRate;
}

/** Valida los promedios diarios configurables de gas y electricidad. */
export function validateEnergySettings(body: unknown): { gasDailyAverage: number; electricityDailyAverage: number } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Enviá la configuración de energía.');
  const { gasDailyAverage, electricityDailyAverage } = body as Record<string, unknown>;
  if (typeof gasDailyAverage !== 'number' || !Number.isFinite(gasDailyAverage) || gasDailyAverage <= 0) throw new InputError('El promedio diario de gas debe ser mayor que cero.');
  if (typeof electricityDailyAverage !== 'number' || !Number.isFinite(electricityDailyAverage) || electricityDailyAverage <= 0) throw new InputError('El promedio diario de electricidad debe ser mayor que cero.');
  return { gasDailyAverage, electricityDailyAverage };
}
