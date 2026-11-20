import { Schema, type Connection } from 'mongoose';
import type { StickerSettings } from '@dessert-cost/shared';
import { InputError } from '../supplies/validation.js';

export interface StickerSettingsRepository {
  get(): Promise<StickerSettings>;
  update(settings: ExcludeNullableStickerSettings): Promise<StickerSettings>;
}

interface ExcludeNullableStickerSettings { name: string; purchaseQuantity: number; purchasePrice: number }

const stickerSchema = new Schema<ExcludeNullableStickerSettings>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  purchaseQuantity: { type: Number, required: true, validate: (value: number) => Number.isInteger(value) && value > 0 },
  purchasePrice: { type: Number, required: true, validate: (value: number) => Number.isFinite(value) && value >= 0 },
}, { timestamps: true, versionKey: false, bufferCommands: false });

/** Valida la compra de stickers sin convertir textos enviados por el navegador. */
export function validateStickerSettings(body: unknown): ExcludeNullableStickerSettings {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Enviá los datos de compra de los stickers.');
  const { name, purchaseQuantity, purchasePrice } = body as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) throw new InputError('El nombre del sticker debe tener entre 1 y 120 caracteres.');
  if (typeof purchaseQuantity !== 'number' || !Number.isInteger(purchaseQuantity) || purchaseQuantity <= 0) throw new InputError('La cantidad de stickers debe ser un entero mayor que cero.');
  if (typeof purchasePrice !== 'number' || !Number.isFinite(purchasePrice) || purchasePrice < 0) throw new InputError('El precio de los stickers debe ser un número no negativo.');
  return { name: name.trim(), purchaseQuantity, purchasePrice };
}

/** Crea la configuración única de stickers para todos los envases. */
export function createStickerSettingsRepository(connection: Connection): StickerSettingsRepository {
  const StickerModel = connection.model<ExcludeNullableStickerSettings>('StickerSettings', stickerSchema, 'sticker_settings');

  return {
    /** Devuelve campos null hasta que se registre la primera compra. */
    async get() {
      const document = await StickerModel.findOne().lean().exec();
      return document ? { name: document.name, purchaseQuantity: document.purchaseQuantity, purchasePrice: document.purchasePrice } : { name: null, purchaseQuantity: null, purchasePrice: null };
    },
    /** Reemplaza la configuración única o la crea cuando todavía no existe. */
    async update(settings) {
      const previous = await StickerModel.findOne().lean().exec();
      const document = previous
        ? await StickerModel.findByIdAndUpdate(previous._id, { $set: settings }, { returnDocument: 'after', runValidators: true }).lean().exec()
        : (await StickerModel.create(settings)).toObject();
      if (!document) throw new Error('No se pudo recuperar la configuración de stickers actualizada.');
      return { name: document.name, purchaseQuantity: document.purchaseQuantity, purchasePrice: document.purchasePrice };
    },
  };
}
