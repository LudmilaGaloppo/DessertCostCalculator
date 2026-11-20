import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';
import { createSupplyRepository } from '../../src/supplies/repository.js';
import { createRecipeRepository } from '../../src/recipes/repository.js';
import { createCostSettingsRepository } from '../../src/settings/repository.js';
import { createPackagingRepository } from '../../src/packaging/repository.js';
import { createStickerSettingsRepository } from '../../src/packaging/sticker-settings.js';
import type { Recipe, Supply } from '@dessert-cost/shared';

test('MongoDB local persiste insumos, permite releerlos desde otra conexión y actualiza por ID', async (context) => {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/dessert_cost_calculator';
  // dbName reemplaza la base de la URI: nunca se escribe en el catálogo de la usuaria.
  const dbName = `dessert_cost_test_${randomUUID().replaceAll('-', '')}`;
  const connection = await mongoose.createConnection(uri, { dbName, serverSelectionTimeoutMS: 5000 }).asPromise();
  const server = createApp(createSupplyRepository(connection), createRecipeRepository(connection), createCostSettingsRepository(connection), createPackagingRepository(connection), createStickerSettingsRepository(connection)).listen(0, '127.0.0.1');
  context.after(async () => {
    server.closeAllConnections();
    server.close();
    try {
      assert.equal(connection.name, dbName);
      assert.match(dbName, /^dessert_cost_test_[a-f0-9]{32}$/);
      await connection.dropDatabase();
    } finally { await connection.close(); }
  });
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/supplies`;
  const headers = { 'Content-Type': 'application/json' };
  const input = { name: 'Harina de prueba', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 };
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(input) });
  assert.equal(response.status, 201);
  const { supply } = await response.json() as { supply: Supply };
  assert.match(supply.id, /^[a-f0-9]{24}$/);

  const secondConnection = await mongoose.createConnection(uri, { dbName, serverSelectionTimeoutMS: 5000 }).asPromise();
  try {
    assert.deepEqual(await createSupplyRepository(secondConnection).list(), [supply]);
  } finally { await secondConnection.close(); }

  const updated = await fetch(`${url}/${supply.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...input, purchasePrice: 8000 }) });
  assert.equal(updated.status, 200);
  const saved = await (await fetch(url)).json() as { supplies: Supply[] };
  assert.equal(saved.supplies.length, 1);
  assert.equal(saved.supplies[0].id, supply.id);
  assert.equal(saved.supplies[0].purchasePrice, 8000);
  const recipesUrl = `http://127.0.0.1:${address.port}/api/recipes`;
  const recipeInput = { name: 'Cookies de prueba', yieldQuantity: 12, yieldUnit: 'unit', workingHours: 3, gasOvenMinutes: 90, electricMixerMinutes: 5, ingredients: [{ supplyId: supply.id, quantity: 375, unit: 'g' }] };
  const recipeResponse = await fetch(recipesUrl, { method: 'POST', headers, body: JSON.stringify(recipeInput) });
  assert.equal(recipeResponse.status, 201);
  const { recipe } = await recipeResponse.json() as { recipe: Recipe };
  assert.match(recipe.id, /^[a-f0-9]{24}$/);
  assert.deepEqual((await (await fetch(recipesUrl)).json() as { recipes: Recipe[] }).recipes, [recipe]);
  const updatedRecipeResponse = await fetch(`${recipesUrl}/${recipe.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...recipeInput, yieldQuantity: 15 }) });
  assert.equal(updatedRecipeResponse.status, 200);
  assert.equal(((await updatedRecipeResponse.json()) as { recipe: Recipe }).recipe.yieldQuantity, 15);
  assert.equal((await fetch(`${url}/${supply.id}`, { method: 'DELETE' })).status, 409);
  const unusedResponse = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...input, name: 'Azúcar sin uso' }) });
  const { supply: unusedSupply } = await unusedResponse.json() as { supply: Supply };
  assert.equal((await fetch(`${url}/${unusedSupply.id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await createSupplyRepository(connection).list()).some((item) => item.id === unusedSupply.id), false);
  const settingsUrl = `http://127.0.0.1:${address.port}/api/settings/costs`;
  assert.deepEqual(await (await fetch(settingsUrl)).json(), { settings: { hourlyRate: null, gasDailyAverage: null, electricityDailyAverage: null } });
  assert.equal((await fetch(settingsUrl, { method: 'PUT', headers, body: JSON.stringify({ hourlyRate: 5000 }) })).status, 200);
  assert.deepEqual(await (await fetch(settingsUrl)).json(), { settings: { hourlyRate: 5000, gasDailyAverage: null, electricityDailyAverage: null } });
  assert.equal((await fetch(`http://127.0.0.1:${address.port}/api/settings/energy`, { method: 'PUT', headers, body: JSON.stringify({ gasDailyAverage: 3000, electricityDailyAverage: 2850 }) })).status, 200);
  assert.deepEqual(await (await fetch(settingsUrl)).json(), { settings: { hourlyRate: 5000, gasDailyAverage: 3000, electricityDailyAverage: 2850 } });
  const packagingUrl = `http://127.0.0.1:${address.port}/api/packaging`;
  const boxInput = { name: 'Caja de prueba', kind: 'box', purchaseQuantity: 4, purchasePrice: 4800, capacity: 12, capacityUnit: 'unit', stickersPerPackage: 1 };
  assert.equal((await fetch(packagingUrl, { method: 'POST', headers, body: JSON.stringify(boxInput) })).status, 201);
  assert.equal((await (await fetch(packagingUrl)).json() as { packaging: unknown[] }).packaging.length, 1);
  const stickerUrl = `http://127.0.0.1:${address.port}/api/settings/stickers`;
  assert.equal((await fetch(stickerUrl, { method: 'PUT', headers, body: JSON.stringify({ name: 'Sticker de prueba', purchaseQuantity: 80, purchasePrice: 28000 }) })).status, 200);
  assert.deepEqual(await (await fetch(stickerUrl)).json(), { stickers: { name: 'Sticker de prueba', purchaseQuantity: 80, purchasePrice: 28000 } });
  assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...input, purchaseQuantity: 0 }) })).status, 400);
  assert.equal(await connection.collection('supplies').countDocuments(), 1);
  assert.equal(await connection.collection('recipes').countDocuments(), 1);
  assert.equal(await connection.collection('settings').countDocuments(), 1);
  assert.equal(await connection.collection('packaging').countDocuments(), 1);
  assert.equal(await connection.collection('sticker_settings').countDocuments(), 1);
});
