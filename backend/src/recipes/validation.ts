import type { RecipeInput, Supply, Unit } from '@dessert-cost/shared';
import { InputError } from '../supplies/validation.js';

const dimensions: Record<Unit, string> = { g: 'mass', kg: 'mass', ml: 'volume', l: 'volume', unit: 'count' };

/** Comprueba que una unidad externa pertenezca a las admitidas por el modelo. */
function isUnit(value: unknown): value is Unit {
  return typeof value === 'string' && Object.hasOwn(dimensions, value);
}

/** Valida una receta y sus referencias al catálogo, devolviendo solo datos persistibles. */
export function validateRecipeInput(body: unknown, supplies: readonly Supply[]): RecipeInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Enviá los datos de una receta.');
  const { name, yieldQuantity, yieldUnit, ingredients } = body as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) throw new InputError('El nombre debe tener entre 1 y 120 caracteres.');
  if (typeof yieldQuantity !== 'number' || !Number.isFinite(yieldQuantity) || yieldQuantity <= 0) throw new InputError('El rendimiento debe ser mayor que cero.');
  if (!isUnit(yieldUnit)) throw new InputError('Elegí una unidad de rendimiento válida.');
  if (!Array.isArray(ingredients) || ingredients.length < 1 || ingredients.length > 100) throw new InputError('La receta debe tener entre 1 y 100 ingredientes.');

  /** Comprueba la cantidad y la compatibilidad de cada ingrediente con su compra. */
  function validateIngredient(value: unknown, index: number) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError(`Revisá el ingrediente ${index + 1}.`);
    const { supplyId, quantity, unit } = value as Record<string, unknown>;
    const supply = supplies.find((item) => item.id === supplyId);
    if (typeof supplyId !== 'string' || !supply) throw new InputError(`Elegí un insumo del catálogo para el ingrediente ${index + 1}.`);
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) throw new InputError(`La cantidad del ingrediente ${index + 1} debe ser mayor que cero.`);
    if (!isUnit(unit) || dimensions[unit] !== dimensions[supply.purchaseUnit]) throw new InputError(`La unidad del ingrediente ${index + 1} no es compatible con ${supply.name}.`);
    return { supplyId, quantity, unit };
  }

  return { name: name.trim(), yieldQuantity, yieldUnit, ingredients: ingredients.map(validateIngredient) };
}
