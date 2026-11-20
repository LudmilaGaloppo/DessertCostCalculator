import type { RecipeInput, Supply } from '@dessert-cost/shared';
import type { RecipeFormValues } from '../types/recipe-form.js';
import { parseDecimal, parseUnit } from './ingredient-form.js';
import { calculateRecipeIngredients } from '../domain/costs.js';

/** Crea campos vacíos independientes para una nueva receta. */
export function emptyRecipeForm(): RecipeFormValues {
  return { name: '', yieldQuantity: '', yieldUnit: 'unit', ingredients: [{ supplyId: '', quantity: '', unit: 'g' }] };
}

/** Convierte los números persistidos en textos editables por React Hook Form. */
export function recipeToForm(recipe: RecipeInput): RecipeFormValues {
  return {
    name: recipe.name, yieldQuantity: String(recipe.yieldQuantity), yieldUnit: recipe.yieldUnit,
    ingredients: recipe.ingredients.map((item) => ({ ...item, quantity: String(item.quantity) })),
  };
}

/** Prepara la receta y verifica las cantidades y unidades contra los insumos vigentes. */
export function recipeInputFromForm(values: RecipeFormValues, supplies: readonly Supply[]): RecipeInput {
  const name = values.name.trim();
  if (!name || name.length > 120) throw new Error('El nombre debe tener entre 1 y 120 caracteres.');
  const yieldQuantity = parseDecimal(values.yieldQuantity, 'el rendimiento');
  if (yieldQuantity <= 0) throw new Error('El rendimiento debe ser mayor que cero.');
  if (!values.ingredients.length || values.ingredients.length > 100) throw new Error('Agregá entre 1 y 100 ingredientes.');

  /** Convierte y valida la cantidad de una fila antes de calcular el costo. */
  function toIngredient(item: RecipeFormValues['ingredients'][number], index: number) {
    const quantity = parseDecimal(item.quantity, `la cantidad del ingrediente ${index + 1}`);
    if (quantity <= 0) throw new Error(`La cantidad del ingrediente ${index + 1} debe ser mayor que cero.`);
    return { supplyId: item.supplyId, quantity, unit: parseUnit(item.unit) };
  }

  const input = { name, yieldQuantity, yieldUnit: parseUnit(values.yieldUnit), ingredients: values.ingredients.map(toIngredient) };
  calculateRecipeIngredients(input, supplies);
  return input;
}
