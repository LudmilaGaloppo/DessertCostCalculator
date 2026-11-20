import { InputError } from '../supplies/validation.js';

/** Valida el valor monetario de una hora sin convertir textos enviados por el cliente. */
export function validateHourlyRate(body: unknown): number {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Enviá la configuración de costos.');
  const { hourlyRate } = body as Record<string, unknown>;
  if (typeof hourlyRate !== 'number' || !Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new InputError('El valor de la hora debe ser mayor que cero.');
  return hourlyRate;
}
