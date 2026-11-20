import { Schema, type Connection } from 'mongoose';
import type { Recipe, RecipeInput, RecipeIngredient } from '@dessert-cost/shared';

export interface RecipeRepository {
  list(): Promise<Recipe[]>;
  create(input: RecipeInput): Promise<Recipe>;
  update(id: string, input: RecipeInput): Promise<Recipe | null>;
  delete(id: string): Promise<boolean>;
}

/** Rechaza cantidades cero, negativas o no finitas antes de persistir. */
function isPositiveFinite(value: number): boolean { return Number.isFinite(value) && value > 0; }

const units = ['g', 'kg', 'ml', 'l', 'unit'];
const ingredientSchema = new Schema<RecipeIngredient>({
  supplyId: { type: String, required: true },
  quantity: { type: Number, required: true, validate: isPositiveFinite },
  unit: { type: String, required: true, enum: units },
}, { _id: false });
const recipeSchema = new Schema<RecipeInput>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  yieldQuantity: { type: Number, required: true, validate: isPositiveFinite },
  yieldUnit: { type: String, required: true, enum: units },
  workingHours: { type: Number, default: null, validate: { validator: (value: number | null) => value === null || (Number.isFinite(value) && value >= 0) } },
  gasOvenMinutes: { type: Number, default: null, validate: { validator: (value: number | null) => value === null || (Number.isFinite(value) && value >= 0) } },
  electricMixerMinutes: { type: Number, default: null, validate: { validator: (value: number | null) => value === null || (Number.isFinite(value) && value >= 0) } },
  ingredients: { type: [ingredientSchema], required: true },
}, { timestamps: true, versionKey: false, bufferCommands: false });

/** Crea las operaciones de recetas sobre una conexión de MongoDB. */
export function createRecipeRepository(connection: Connection): RecipeRepository {
  const RecipeModel = connection.model<RecipeInput>('Recipe', recipeSchema, 'recipes');

  /** Traduce el documento MongoDB al contrato público, sin campos internos ni precios. */
  function toRecipe(document: RecipeInput & { _id: { toString(): string } }): Recipe {
    return {
      id: document._id.toString(), name: document.name,
      yieldQuantity: document.yieldQuantity, yieldUnit: document.yieldUnit,
      workingHours: document.workingHours ?? null,
      gasOvenMinutes: document.gasOvenMinutes ?? null,
      electricMixerMinutes: document.electricMixerMinutes ?? null,
      ingredients: document.ingredients.map(({ supplyId, quantity, unit }) => ({ supplyId, quantity, unit })),
    };
  }

  return {
    /** Recupera las recetas ordenadas por nombre. */
    async list() { return (await RecipeModel.find().sort({ name: 1, _id: 1 }).lean().exec()).map(toRecipe); },
    /** Guarda una receta nueva y devuelve su identificador. */
    async create(input) { return toRecipe(await RecipeModel.create(input)); },
    /** Actualiza una receta existente sin generar una copia. */
    async update(id, input) {
      const document = await RecipeModel.findByIdAndUpdate(id, { $set: input }, { returnDocument: 'after', runValidators: true }).lean().exec();
      return document ? toRecipe(document) : null;
    },
    /** Elimina la receta indicada y comunica si todavía existía. */
    async delete(id) { return (await RecipeModel.findByIdAndDelete(id).lean().exec()) !== null; },
  };
}
