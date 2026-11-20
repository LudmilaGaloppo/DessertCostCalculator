import { Schema, type Connection } from 'mongoose';
import type { CostSettings } from '@dessert-cost/shared';

export interface CostSettingsRepository {
  get(): Promise<CostSettings>;
  updateHourlyRate(hourlyRate: number): Promise<CostSettings>;
  updateEnergy(gasDailyAverage: number, electricityDailyAverage: number): Promise<CostSettings>;
}

interface CostSettingsDocument { key: string; hourlyRate?: number; gasDailyAverage?: number; electricityDailyAverage?: number }

const settingsSchema = new Schema<CostSettingsDocument>({
  key: { type: String, required: true, unique: true },
  hourlyRate: { type: Number, validate: isPositiveFinite },
  gasDailyAverage: { type: Number, validate: isPositiveFinite },
  electricityDailyAverage: { type: Number, validate: isPositiveFinite },
}, { timestamps: true, versionKey: false, bufferCommands: false });

/** Impide guardar una tarifa vacía, infinita, negativa o cero. */
function isPositiveFinite(value: number): boolean { return Number.isFinite(value) && value > 0; }

/** Crea el acceso a la configuración general de costos en MongoDB. */
export function createCostSettingsRepository(connection: Connection): CostSettingsRepository {
  const SettingsModel = connection.model<CostSettingsDocument>('CostSettings', settingsSchema, 'settings');

  return {
    /** Devuelve null en cada valor que todavía no haya sido configurado. */
    async get() {
      const document = await SettingsModel.findOne({ key: 'costs' }).lean().exec();
      return { hourlyRate: document?.hourlyRate ?? null, gasDailyAverage: document?.gasDailyAverage ?? null, electricityDailyAverage: document?.electricityDailyAverage ?? null };
    },
    /** Guarda el valor compartido de la hora, creando la configuración si no existía. */
    async updateHourlyRate(hourlyRate) {
      const document = await SettingsModel.findOneAndUpdate(
        { key: 'costs' }, { $set: { hourlyRate } }, { upsert: true, returnDocument: 'after', runValidators: true },
      ).lean().exec();
      return { hourlyRate: document.hourlyRate ?? null, gasDailyAverage: document.gasDailyAverage ?? null, electricityDailyAverage: document.electricityDailyAverage ?? null };
    },
    /** Guarda los promedios diarios usados por el prorrateo simple de energía. */
    async updateEnergy(gasDailyAverage, electricityDailyAverage) {
      const document = await SettingsModel.findOneAndUpdate(
        { key: 'costs' }, { $set: { gasDailyAverage, electricityDailyAverage } }, { upsert: true, returnDocument: 'after', runValidators: true },
      ).lean().exec();
      return { hourlyRate: document.hourlyRate ?? null, gasDailyAverage: document.gasDailyAverage ?? null, electricityDailyAverage: document.electricityDailyAverage ?? null };
    },
  };
}
