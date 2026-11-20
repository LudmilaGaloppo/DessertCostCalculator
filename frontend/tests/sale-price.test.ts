import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSaleProfit, calculateSuggestedSalePrice } from '../src/domain/costs.js';
import type { PricingBasis } from '@dessert-cost/shared';

test('distingue recargo sobre costo de margen sobre precio de venta', () => {
  assert.equal(calculateSuggestedSalePrice(10000, 50, 'markup'), 15000);
  assert.equal(calculateSuggestedSalePrice(10000, 50, 'margin'), 20000);
  const profit = calculateSaleProfit(10000, 15000);
  assert.equal(profit.profit, 5000);
  assert.equal(profit.markupPercentage, 50);
  assert.ok(profit.marginPercentage !== null && Math.abs(profit.marginPercentage - 100 / 3) < 1e-10);
  assert.deepEqual(calculateSaleProfit(10000, 20000), { salePrice: 20000, profit: 10000, markupPercentage: 100, marginPercentage: 50 });
});

test('no redondea el precio a múltiplos ni incorpora comisiones', () => {
  assert.equal(calculateSuggestedSalePrice(8175, 30, 'markup'), 10627.5);
  assert.equal(calculateSuggestedSalePrice(8175, 30, 'margin'), 8175 / 0.7);
  assert.equal(calculateSaleProfit(8175, 10600).profit, 2425);
});

test('permite recargos mayores al 100%, pero exige margen menor al 100%', () => {
  assert.equal(calculateSuggestedSalePrice(10000, 150, 'markup'), 25000);
  assert.equal(calculateSuggestedSalePrice(100, 99, 'margin'), 100 / (1 - 0.99));
  for (const percentage of [100, 101, 150]) {
    assert.throws(() => calculateSuggestedSalePrice(10000, percentage, 'margin'), /menor que 100/);
  }
  assert.throws(() => calculateSuggestedSalePrice(10000, 50, 'other' as PricingBasis), RangeError);
});

test('el precio manual admite ganancia, equilibrio, pérdida y precio cero', () => {
  assert.deepEqual(calculateSaleProfit(10000, 8000), { salePrice: 8000, profit: -2000, markupPercentage: -20, marginPercentage: -25 });
  assert.deepEqual(calculateSaleProfit(10000, 10000), { salePrice: 10000, profit: 0, markupPercentage: 0, marginPercentage: 0 });
  assert.deepEqual(calculateSaleProfit(10000, 0), { salePrice: 0, profit: -10000, markupPercentage: -100, marginPercentage: null });
});

test('conserva ceros explícitos y no inventa porcentajes con denominador cero', () => {
  for (const basis of ['markup', 'margin'] as const) {
    assert.equal(calculateSuggestedSalePrice(10000, 0, basis), 10000);
    assert.equal(calculateSuggestedSalePrice(0, 50, basis), 0);
  }
  assert.deepEqual(calculateSaleProfit(0, 100), { salePrice: 100, profit: 100, markupPercentage: null, marginPercentage: 100 });
  assert.deepEqual(calculateSaleProfit(0, 0), { salePrice: 0, profit: 0, markupPercentage: null, marginPercentage: null });
});

test('rechaza entradas inválidas y resultados que desbordan', () => {
  for (const value of [undefined, null, '', '50', -1, NaN, Infinity]) {
    // @ts-expect-error Dato externo inválido para verificar la validación en ejecución.
    assert.throws(() => calculateSuggestedSalePrice(value, 50, 'markup'), RangeError);
    // @ts-expect-error Dato externo inválido para verificar la validación en ejecución.
    assert.throws(() => calculateSuggestedSalePrice(100, value, 'markup'), RangeError);
    // @ts-expect-error Dato externo inválido para verificar la validación en ejecución.
    assert.throws(() => calculateSaleProfit(value, 100), RangeError);
    // @ts-expect-error Dato externo inválido para verificar la validación en ejecución.
    assert.throws(() => calculateSaleProfit(100, value), RangeError);
  }
  assert.throws(() => calculateSuggestedSalePrice(Number.MAX_VALUE, 100, 'markup'), RangeError);
  assert.throws(() => calculateSaleProfit(Number.MIN_VALUE, 1), RangeError);
});
