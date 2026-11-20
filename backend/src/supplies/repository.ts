import { Schema, type Connection } from 'mongoose';
import type { Supply, SupplyInput } from '@dessert-cost/shared';

export interface SupplyRepository {
  list(): Promise<Supply[]>;
  create(input: SupplyInput): Promise<Supply>;
  update(id: string, input: SupplyInput): Promise<Supply | null>;
  delete(id: string): Promise<boolean>;
}

const supplySchema = new Schema<SupplyInput>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  purchaseQuantity: { type: Number, required: true, validate: isPositiveFinite },
  purchaseUnit: { type: String, required: true, enum: ['g', 'kg', 'ml', 'l', 'unit'] },
  purchasePrice: { type: Number, required: true, validate: isNonNegativeFinite },
}, { timestamps: true, versionKey: false, bufferCommands: false });

/** Impide que MongoDB reciba una cantidad de compra no finita, negativa o cero. */
function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** Permite precios cero explícitos y rechaza precios negativos o no finitos. */
function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/** Crea las operaciones del catálogo para una conexión MongoDB, usando la colección supplies. */
export function createSupplyRepository(connection: Connection): SupplyRepository {
  const SupplyModel = connection.model<SupplyInput>('Supply', supplySchema, 'supplies');

  /** Devuelve documentos como el tipo Supply del frontend, traduciendo _id a id. */
  function toSupply(document: SupplyInput & { _id: { toString(): string } }): Supply {
    return { id: document._id.toString(), name: document.name, purchaseQuantity: document.purchaseQuantity, purchaseUnit: document.purchaseUnit, purchasePrice: document.purchasePrice };
  }

  return {
    /** Lee el catálogo ordenado por nombre. */
    async list() {
      const documents = await SupplyModel.find().sort({ name: 1, _id: 1 }).lean().exec();
      return documents.map(toSupply);
    },
    /** Inserta un insumo nuevo y devuelve el identificador generado por MongoDB. */
    async create(input) {
      const document = await SupplyModel.create(input);
      return toSupply(document);
    },
    /** Reemplaza los datos de compra del insumo indicado; devuelve null si no existe. */
    async update(id, input) {
      const document = await SupplyModel.findByIdAndUpdate(id, { $set: input }, { returnDocument: 'after', runValidators: true }).lean().exec();
      return document ? toSupply(document) : null;
    },
    /** Elimina el insumo identificado y comunica si todavía existía. */
    async delete(id) {
      return (await SupplyModel.findByIdAndDelete(id).lean().exec()) !== null;
    },
  };
}
