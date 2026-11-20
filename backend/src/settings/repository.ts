import { Schema, type Connection } from 'mongoose';
import type { CostSettings } from '@dessert-cost/shared';

export interface CostSettingsRepository {
  get(): Promise<CostSettings>;
  update(hourlyRate: number): Promise<CostSettings>;
}

interface CostSettingsDocument { key: string; hourlyRate: number }

const settingsSchema = new Schema<CostSettingsDocument>({
  key: { type: String, required: true, unique: true },
  hourlyRate: { type: Number, required: true, validate: isPositiveFinite },
}, { timestamps: true, versionKey: false, bufferCommands: false });

/** Impide guardar una tarifa vacía, infinita, negativa o cero. */
function isPositiveFinite(value: number): boolean { return Number.isFinite(value) && value > 0; }

/** Crea el acceso a la configuración general de costos en MongoDB. */
export function createCostSettingsRepository(connection: Connection): CostSettingsRepository {
  const SettingsModel = connection.model<CostSettingsDocument>('CostSettings', settingsSchema, 'settings');

  return {
    /** Devuelve null mientras todavía no se haya configurado el valor de la hora. */
    async get() {
      const document = await SettingsModel.findOne({ key: 'costs' }).lean().exec();
      return { hourlyRate: document?.hourlyRate ?? null };
    },
    /** Guarda una única configuración compartida, creándola si no existía. */
    async update(hourlyRate) {
      const document = await SettingsModel.findOneAndUpdate(
        { key: 'costs' }, { $set: { hourlyRate } }, { upsert: true, returnDocument: 'after', runValidators: true },
      ).lean().exec();
      return { hourlyRate: document.hourlyRate };
    },
  };
}
