import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSupplyInput, InputError } from '../server/supplies/validation.js';
import { supplyInputFromForm, exampleIngredientForm, validateDecimalField } from '../src/utils/ingredient-form.js';

const purchase = { name: ' Harina ', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 };

test('el servidor permite solo datos de compra y recorta el nombre', () => {
  assert.deepEqual(validateSupplyInput({ ...purchase, id: 'injected', usedQuantity: 375, $set: {} }), { ...purchase, name: 'Harina' });
});

test('el servidor rechaza entradas inválidas sin confiar en la validación del formulario', () => {
  for (const invalid of [null, [], {}, { ...purchase, name: '  ' }, { ...purchase, name: 'a'.repeat(121) }, { ...purchase, purchasePrice: '6000' }, { ...purchase, purchasePrice: -1 }, { ...purchase, purchaseQuantity: 0 }, { ...purchase, purchaseQuantity: Infinity }, { ...purchase, purchaseUnit: { $ne: null } }, { ...purchase, purchaseUnit: 'gr' }]) {
    assert.throws(() => validateSupplyInput(invalid), InputError);
  }
  assert.equal(validateSupplyInput({ ...purchase, purchasePrice: 0 }).purchasePrice, 0);
});

test('guardar un insumo no exige ni persiste los datos de uso', () => {
  assert.deepEqual(supplyInputFromForm({ ...exampleIngredientForm, usedQuantity: '', usedUnit: '' }), { name: 'Harina', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 });
});

test('las reglas de React Hook Form aceptan coma y rechazan vacíos, negativos y cero como divisor', () => {
  assert.equal(validateDecimalField('2,5', 'cantidad', true), true);
  assert.equal(validateDecimalField('0', 'precio'), true);
  assert.notEqual(validateDecimalField('', 'cantidad'), true);
  assert.notEqual(validateDecimalField('0', 'cantidad', true), true);
  assert.notEqual(validateDecimalField('-1', 'precio'), true);
});
