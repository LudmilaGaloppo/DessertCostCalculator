// Vocabulario del modelo:
// supply = insumo del catálogo con sus datos de compra; supplies = array de insumos.
// ingredient = uso de un insumo en una receta, con cantidad y unidad propias.
// ingredient.supplyId referencia supply.id; el precio se obtiene del insumo.
// Ejemplo y explicación: ../../../docs/04-calculo-de-receta.md

import type { Unit, Supply, RecipeIngredient, RecipeIngredientsCost } from '@dessert-cost/shared';

interface UnitDefinition {
  dimension: 'mass' | 'volume' | 'count';
  factor: number;
}

// Record exige una definición para cada Unit. En ejecución sigue siendo un objeto.
const units: Record<Unit, UnitDefinition> = {
  g: { dimension: 'mass', factor: 1 },
  kg: { dimension: 'mass', factor: 1000 },
  ml: { dimension: 'volume', factor: 1 },
  l: { dimension: 'volume', factor: 1000 },
  unit: { dimension: 'count', factor: 1 },
};

/** Valida un número finito no negativo (o mayor que cero si positive es true); lanza un error si no cumple. */
function requireNumber(value: unknown, label: string, positive = false): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || (positive ? value <= 0 : value < 0)) {
    throw new RangeError(`${label} debe ser un número finito ${positive ? 'mayor que cero' : 'no negativo'}.`);
  }
}

/** Comprueba que el identificador sea un texto no vacío ni compuesto solo por espacios; si falla, lanza un error. */
function requireId(value: unknown): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('El identificador del insumo debe ser un texto no vacío.');
  }
}

/** Convierte una cantidad entre unidades compatibles usando sus factores; rechaza cantidades o unidades inválidas. */
export function convertQuantity(quantity: number, fromUnit: Unit, toUnit: Unit): number {
  requireNumber(quantity, 'La cantidad');
  if (!Object.hasOwn(units, fromUnit) || !Object.hasOwn(units, toUnit)) {
    throw new RangeError('Unidad desconocida. Usá g, kg, ml, l o unit.');
  }
  const from = units[fromUnit];
  const to = units[toUnit];
  if (from.dimension !== to.dimension) {
    throw new RangeError(`Unidades incompatibles: ${fromUnit} y ${toUnit}.`);
  }
  const converted = quantity * (from.factor / to.factor);
  requireNumber(converted, 'La cantidad convertida');
  return converted;
}

/** Calcula el costo proporcional del ingrediente: verifica el insumo, convierte la cantidad usada y aplica el precio de compra. */
export function calculateIngredientCost(supply: Supply, ingredient: RecipeIngredient): number {
  requireId(supply.id);
  requireId(ingredient.supplyId);
  if (supply.id !== ingredient.supplyId) {
    throw new Error('El ingrediente no referencia este insumo.');
  }
  requireNumber(supply.purchasePrice, 'El precio de compra');
  requireNumber(supply.purchaseQuantity, 'La cantidad comprada', true);
  const usedQuantity = convertQuantity(ingredient.quantity, ingredient.unit, supply.purchaseUnit);
  const cost = supply.purchasePrice * (usedQuantity / supply.purchaseQuantity);
  requireNumber(cost, 'El costo calculado');
  return cost;
}

/** Busca cada insumo por ID y devuelve el costo de cada ingrediente y su subtotal, sin modificar la receta ni el catálogo. */
export function calculateRecipeIngredients(
  recipe: { ingredients: readonly RecipeIngredient[] },
  supplies: readonly Supply[],
): RecipeIngredientsCost {
  if (!Array.isArray(recipe.ingredients) || !Array.isArray(supplies)) {
    throw new TypeError('Los ingredientes y el catálogo deben ser arrays.');
  }
  // Índice dinámico: la clave es el ID (string) y el valor es el insumo (Supply).
  // set agrega, has verifica existencia y get recupera el insumo por su ID.
  const catalog = new Map<string, Supply>();
  for (const supply of supplies) {
    requireId(supply.id);
    if (catalog.has(supply.id)) throw new Error(`Identificador duplicado: ${supply.id}.`);
    catalog.set(supply.id, supply);
  }

  // Arma cada línea del desglose con los datos de uso y el costo calculado del insumo.
  const items = recipe.ingredients.map((ingredient) => {
    requireId(ingredient.supplyId);
    const supply = catalog.get(ingredient.supplyId);
    if (!supply) throw new Error(`Insumo inexistente: ${ingredient.supplyId}.`);
    return {
      supplyId: supply.id,
      name: supply.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      cost: calculateIngredientCost(supply, ingredient),
    };
  });
  // Acumula los costos de las líneas para obtener el subtotal de ingredientes.
  const ingredientsSubtotal = items.reduce((total, item) => total + item.cost, 0);
  requireNumber(ingredientsSubtotal, 'El subtotal de ingredientes');
  return { items, ingredientsSubtotal };
}
