import { Schema, type Connection } from 'mongoose';
import type { Packaging, PackagingInput } from '@dessert-cost/shared';

export interface PackagingRepository {
  list(): Promise<Packaging[]>;
  create(input: PackagingInput): Promise<Packaging>;
  update(id: string, input: PackagingInput): Promise<Packaging | null>;
}

/** Comprueba cantidades enteras positivas para compras y capacidades. */
function isPositiveInteger(value: number): boolean { return Number.isInteger(value) && value > 0; }

/** Comprueba precios finitos, permitiendo un envase obtenido sin costo. */
function isNonNegativeFinite(value: number): boolean { return Number.isFinite(value) && value >= 0; }

const packagingSchema = new Schema<PackagingInput>({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  kind: { type: String, required: true, enum: ['individual', 'box'] },
  purchaseQuantity: { type: Number, required: true, validate: isPositiveInteger },
  purchasePrice: { type: Number, required: true, validate: isNonNegativeFinite },
  capacity: { type: Number, required: true, validate: isPositiveInteger },
  capacityUnit: { type: String, required: true, enum: ['unit'] },
  stickersPerPackage: { type: Number, required: true, min: 0, validate: Number.isInteger },
}, { timestamps: true, versionKey: false, bufferCommands: false });

/** Crea el catálogo de envases sobre la colección packaging. */
export function createPackagingRepository(connection: Connection): PackagingRepository {
  const PackagingModel = connection.model<PackagingInput>('Packaging', packagingSchema, 'packaging');

  /** Traduce un documento de MongoDB al contrato compartido. */
  function toPackaging(document: PackagingInput & { _id: { toString(): string } }): Packaging {
    return { id: document._id.toString(), name: document.name, kind: document.kind, purchaseQuantity: document.purchaseQuantity, purchasePrice: document.purchasePrice, capacity: document.capacity, capacityUnit: document.capacityUnit, stickersPerPackage: document.stickersPerPackage };
  }

  return {
    /** Recupera los envases ordenados por nombre. */
    async list() { return (await PackagingModel.find().sort({ name: 1, _id: 1 }).lean().exec()).map(toPackaging); },
    /** Guarda un envase nuevo y devuelve su identificador. */
    async create(input) { return toPackaging(await PackagingModel.create(input)); },
    /** Actualiza un envase existente o devuelve null si ya no está. */
    async update(id, input) {
      const document = await PackagingModel.findByIdAndUpdate(id, { $set: input }, { returnDocument: 'after', runValidators: true }).lean().exec();
      return document ? toPackaging(document) : null;
    },
  };
}
