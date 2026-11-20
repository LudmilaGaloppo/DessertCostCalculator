import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyRecipeForm, recipeInputFromForm, recipeToForm } from '../src/utils/recipe-form.js';
import type { Supply } from '@dessert-cost/shared';

const flour: Supply = { id: 'flour', name: 'Harina', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 };

test('el formulario arma una receta con rendimiento y cantidades convertibles', () => {
  const input = recipeInputFromForm({
    name: ' Cookies ', yieldQuantity: '12', yieldUnit: 'unit',
    ingredients: [{ supplyId: flour.id, quantity: '375', unit: 'g' }],
  }, [flour]);
  assert.deepEqual(input, { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit', ingredients: [{ supplyId: 'flour', quantity: 375, unit: 'g' }] });
});

test('el formulario rechaza referencias faltantes y unidades incompatibles', () => {
  assert.throws(() => recipeInputFromForm({ name: 'Cookies', yieldQuantity: '12', yieldUnit: 'unit', ingredients: [{ supplyId: '', quantity: '375', unit: 'g' }] }, [flour]), /identificador del insumo/i);
  assert.throws(() => recipeInputFromForm({ name: 'Cookies', yieldQuantity: '12', yieldUnit: 'unit', ingredients: [{ supplyId: 'flour', quantity: '375', unit: 'ml' }] }, [flour]), /incompatibles/i);
});

test('la conversión entre receta persistida y formulario no comparte arrays mutables', () => {
  const empty = emptyRecipeForm();
  const form = recipeToForm({ name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit', ingredients: [{ supplyId: 'flour', quantity: 375, unit: 'g' }] });
  empty.ingredients[0].quantity = '1';
  assert.equal(form.ingredients[0].quantity, '375');
});
