import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSupplyInput, InputError } from '../src/supplies/validation.js';

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

