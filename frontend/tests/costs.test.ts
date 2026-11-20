import test from 'node:test';
import assert from 'node:assert/strict';
import { convertQuantity, calculateIngredientCost, calculateRecipeIngredients } from '../src/domain/costs.js';
import type { Supply, RecipeIngredient, Unit } from '@dessert-cost/shared';

const flour: Supply = Object.freeze({ id: 'flour', name: 'Harina', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 });
const ingredient: RecipeIngredient = Object.freeze({ supplyId: 'flour', quantity: 375, unit: 'g' });

test('convierte masa y volumen en ambos sentidos, y conserva unidades', () => {
  assert.equal(convertQuantity(2.5, 'kg', 'g'), 2500);
  assert.equal(convertQuantity(375, 'g', 'kg'), 0.375);
  assert.equal(convertQuantity(1.5, 'l', 'ml'), 1500);
  assert.equal(convertQuantity(250, 'ml', 'l'), 0.25);
  assert.equal(convertQuantity(3, 'unit', 'unit'), 3);
});

test('rechaza unidades desconocidas y conversiones entre dimensiones', () => {
  for (const pair of [['g', 'ml'], ['kg', 'unit'], ['gr', 'g'], ['g', 'constructor']]) {
    // Simulamos unidades externas inválidas para comprobar la validación en ejecución.
    assert.throws(() => convertQuantity(1, pair[0] as Unit, pair[1] as Unit), RangeError);
  }
});

test('calcula la proporción aunque la compra y el uso tengan distintas unidades', () => {
  assert.equal(calculateIngredientCost(flour, ingredient), 900);
  assert.equal(calculateIngredientCost(flour, { ...ingredient, quantity: 150 }), 360);
  assert.equal(calculateIngredientCost({ ...flour, purchaseQuantity: 2500, purchaseUnit: 'g' }, { ...ingredient, quantity: 0.375, unit: 'kg' }), 900);
});

test('rechaza datos faltantes, texto, negativos y números no finitos', () => {
  for (const value of [undefined, null, '', '6000', NaN, Infinity, -1]) {
    // @ts-expect-error Entrada inválida intencional para probar la validación en ejecución.
    assert.throws(() => calculateIngredientCost({ ...flour, purchasePrice: value }, ingredient));
    // @ts-expect-error Entrada inválida intencional para probar la validación en ejecución.
    assert.throws(() => calculateIngredientCost({ ...flour, purchaseQuantity: value }, ingredient));
    // @ts-expect-error Entrada inválida intencional para probar la validación en ejecución.
    assert.throws(() => calculateIngredientCost(flour, { ...ingredient, quantity: value }));
  }
  assert.throws(() => calculateIngredientCost({ ...flour, purchaseQuantity: 0 }, ingredient));
});

test('permite precio cero y uso cero explícitos; no confunde costo con stock', () => {
  assert.equal(calculateIngredientCost({ ...flour, purchasePrice: 0 }, ingredient), 0);
  assert.equal(calculateIngredientCost(flour, { ...ingredient, quantity: 0 }), 0);
  assert.equal(calculateIngredientCost(flour, { ...ingredient, quantity: 5000 }), 12000);
});

test('devuelve desglose y subtotal sin modificar la receta ni el catálogo', () => {
  const sugar: Supply = Object.freeze({ id: 'sugar', name: 'Azúcar', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 2000 });
  const recipe = Object.freeze({ ingredients: Object.freeze([ingredient, Object.freeze<RecipeIngredient>({ supplyId: 'sugar', quantity: 150, unit: 'g' })]) });
  const result = calculateRecipeIngredients(recipe, Object.freeze([flour, sugar]));
  assert.equal(result.ingredientsSubtotal, 1200);
  assert.deepEqual(result.items.map((item) => item.cost), [900, 300]);
  assert.equal(recipe.ingredients[0].quantity, 375);
  assert.equal(flour.purchaseQuantity, 2.5);
});

test('detecta referencias ausentes, incorrectas e identificadores duplicados', () => {
  assert.throws(() => calculateRecipeIngredients({ ingredients: [ingredient] }, []), /Insumo inexistente/);
  assert.throws(() => calculateIngredientCost(flour, { ...ingredient, supplyId: 'other' }), /no referencia/);
  assert.throws(() => calculateRecipeIngredients({ ingredients: [] }, [flour, flour]), /duplicado/);
  // @ts-expect-error Se omite supplyId intencionalmente para probar un dato externo incompleto.
  assert.throws(() => calculateRecipeIngredients({ ingredients: [{ quantity: 1, unit: 'g' }] }, [flour]), /identificador/);
});

test('recalcula con el precio actual y conserva resultados previos como valores', () => {
  const recipe = { ingredients: [ingredient] };
  const before = calculateRecipeIngredients(recipe, [flour]);
  const after = calculateRecipeIngredients(recipe, [{ ...flour, purchasePrice: 8000 }]);
  assert.equal(before.ingredientsSubtotal, 900);
  assert.equal(after.ingredientsSubtotal, 1200);
});

test('una receta vacía tiene subtotal cero; rechaza colecciones inválidas', () => {
  assert.deepEqual(calculateRecipeIngredients({ ingredients: [] }, []), { items: [], ingredientsSubtotal: 0 });
  // @ts-expect-error Colección inválida intencional.
  assert.throws(() => calculateRecipeIngredients({ ingredients: null }, []), TypeError);
  // @ts-expect-error Colección inválida intencional.
  assert.throws(() => calculateRecipeIngredients({ ingredients: [] }, null), TypeError);
});
