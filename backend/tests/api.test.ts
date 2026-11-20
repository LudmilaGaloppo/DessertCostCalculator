import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import type { SupplyRepository } from '../src/supplies/repository.js';
import type { RecipeRepository } from '../src/recipes/repository.js';
import type { CostSettingsRepository } from '../src/settings/repository.js';
import type { PackagingRepository } from '../src/packaging/repository.js';
import type { StickerSettingsRepository } from '../src/packaging/sticker-settings.js';
import type { Packaging, Recipe, StickerSettings, Supply } from '@dessert-cost/shared';

const id = '507f1f77bcf86cd799439011';
const recipeId = '507f1f77bcf86cd799439012';
const input = { name: 'Harina', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 };

test('la API valida JSON, crea insumos y distingue errores de entrada, ausencia y base de datos', async (context) => {
  const supplies: Supply[] = [];
  const repository: SupplyRepository = {
    /** Simula la lectura para comprobar el contrato HTTP sin MongoDB. */
    async list() { return supplies; },
    /** Conserva el insumo de prueba para verificar la respuesta HTTP de creación. */
    async create(value) { const supply = { ...value, id }; supplies.push(supply); return supply; },
    /** Simula un identificador válido que no está en el catálogo. */
    async update() { return null; },
    /** Elimina el insumo simulado si está presente. */
    async delete(supplyId) {
      const index = supplies.findIndex((supply) => supply.id === supplyId);
      if (index < 0) return false;
      supplies.splice(index, 1);
      return true;
    },
  };
  const savedRecipes: Recipe[] = [];
  const recipeRepository: RecipeRepository = {
    /** Simula la lista de recetas guardadas para comprobar su contrato HTTP. */
    async list() { return savedRecipes; },
    /** Conserva una receta nueva sin copiar precios del catálogo. */
    async create(value) { const recipe = { ...value, id: recipeId }; savedRecipes.push(recipe); return recipe; },
    /** Simula una receta válida que ya no existe. */
    async update() { return null; },
    /** Elimina la receta simulada si está presente. */
    async delete(savedId) {
      const index = savedRecipes.findIndex((recipe) => recipe.id === savedId);
      if (index < 0) return false;
      savedRecipes.splice(index, 1);
      return true;
    },
  };
  let hourlyRate: number | null = null;
  let gasDailyAverage: number | null = null;
  let electricityDailyAverage: number | null = null;
  const settingsRepository: CostSettingsRepository = {
    /** Devuelve el valor actual de la configuración simulada. */
    async get() { return { hourlyRate, gasDailyAverage, electricityDailyAverage }; },
    /** Conserva la tarifa para verificar lectura y actualización por HTTP. */
    async updateHourlyRate(value) { hourlyRate = value; return { hourlyRate, gasDailyAverage, electricityDailyAverage }; },
    /** Conserva los promedios diarios simulados. */
    async updateEnergy(gas, electricity) { gasDailyAverage = gas; electricityDailyAverage = electricity; return { hourlyRate, gasDailyAverage, electricityDailyAverage }; },
  };
  const savedPackaging: Packaging[] = [];
  const packagingRepository: PackagingRepository = {
    /** Devuelve los envases creados durante la prueba HTTP. */
    async list() { return savedPackaging; },
    /** Conserva un envase nuevo con un identificador simulado. */
    async create(value) { const saved = { ...value, id: recipeId }; savedPackaging.push(saved); return saved; },
    /** Simula un envase que ya no existe al intentar actualizarlo. */
    async update() { return null; },
  };
  let stickerSettings: StickerSettings = { name: null, purchaseQuantity: null, purchasePrice: null };
  const stickerRepository: StickerSettingsRepository = {
    /** Devuelve la compra de stickers simulada. */
    async get() { return stickerSettings; },
    /** Conserva la configuración recibida para la siguiente lectura. */
    async update(value) { stickerSettings = value; return stickerSettings; },
  };
  const server = createApp(repository, recipeRepository, settingsRepository, packagingRepository, stickerRepository).listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => { server.closeAllConnections(); server.close(); });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/supplies`;
  const headers = { 'Content-Type': 'application/json' };
  assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...input, purchaseQuantity: 0 }) })).status, 400);
  assert.equal((await fetch(url, { method: 'POST', headers, body: '{' })).status, 400);
  assert.equal((await fetch(url, { method: 'POST', body: 'text' })).status, 415);
  const created = await fetch(url, { method: 'POST', headers, body: JSON.stringify(input) });
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), { supply: { ...input, id } });
  assert.deepEqual(await (await fetch(url)).json(), { supplies: [{ ...input, id }] });
  const recipeInput = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit', workingHours: 3, gasOvenMinutes: 90, electricMixerMinutes: 5, ingredients: [{ supplyId: id, quantity: 375, unit: 'g' }] };
  const recipesUrl = `http://127.0.0.1:${address.port}/api/recipes`;
  const recipeCreated = await fetch(recipesUrl, { method: 'POST', headers, body: JSON.stringify(recipeInput) });
  assert.equal(recipeCreated.status, 201);
  assert.deepEqual(await recipeCreated.json(), { recipe: { ...recipeInput, id: recipeId } });
  assert.deepEqual(await (await fetch(recipesUrl)).json(), { recipes: [{ ...recipeInput, id: recipeId }] });
  const referencedDelete = await fetch(`${url}/${id}`, { method: 'DELETE' });
  assert.equal(referencedDelete.status, 409);
  assert.match(((await referencedDelete.json()) as { message: string }).message, /Cookies/);
  assert.equal((await fetch(recipesUrl, { method: 'POST', headers, body: JSON.stringify({ ...recipeInput, ingredients: [{ ...recipeInput.ingredients[0], unit: 'ml' }] }) })).status, 400);
  const settingsUrl = `http://127.0.0.1:${address.port}/api/settings/costs`;
  assert.deepEqual(await (await fetch(settingsUrl)).json(), { settings: { hourlyRate: null, gasDailyAverage: null, electricityDailyAverage: null } });
  assert.equal((await fetch(settingsUrl, { method: 'PUT', headers, body: JSON.stringify({ hourlyRate: 0 }) })).status, 400);
  assert.deepEqual(await (await fetch(settingsUrl, { method: 'PUT', headers, body: JSON.stringify({ hourlyRate: 5000 }) })).json(), { settings: { hourlyRate: 5000, gasDailyAverage: null, electricityDailyAverage: null } });
  assert.deepEqual(await (await fetch(`http://127.0.0.1:${address.port}/api/settings/energy`, { method: 'PUT', headers, body: JSON.stringify({ gasDailyAverage: 3000, electricityDailyAverage: 2850 }) })).json(), { settings: { hourlyRate: 5000, gasDailyAverage: 3000, electricityDailyAverage: 2850 } });
  const packagingUrl = `http://127.0.0.1:${address.port}/api/packaging`;
  const boxInput = { name: 'Caja', kind: 'box', purchaseQuantity: 4, purchasePrice: 4800, capacity: 12, capacityUnit: 'unit', stickersPerPackage: 1 };
  assert.equal((await fetch(packagingUrl, { method: 'POST', headers, body: JSON.stringify({ ...boxInput, capacity: 0 }) })).status, 400);
  assert.equal((await fetch(packagingUrl, { method: 'POST', headers, body: JSON.stringify(boxInput) })).status, 201);
  assert.equal((await (await fetch(packagingUrl)).json() as { packaging: Packaging[] }).packaging.length, 1);
  const stickerUrl = `http://127.0.0.1:${address.port}/api/settings/stickers`;
  assert.equal((await fetch(stickerUrl, { method: 'PUT', headers, body: JSON.stringify({ name: 'Sticker', purchaseQuantity: 80, purchasePrice: 28000 }) })).status, 200);
  assert.deepEqual(await (await fetch(stickerUrl)).json(), { stickers: { name: 'Sticker', purchaseQuantity: 80, purchasePrice: 28000 } });
  assert.equal((await fetch(`${url}/invalid`, { method: 'PUT', headers, body: JSON.stringify(input) })).status, 400);
  assert.equal((await fetch(`${url}/${id}`, { method: 'PUT', headers, body: JSON.stringify(input) })).status, 404);
  assert.equal((await fetch(`${recipesUrl}/invalid`, { method: 'DELETE' })).status, 400);
  assert.equal((await fetch(`${recipesUrl}/${recipeId}`, { method: 'DELETE' })).status, 204);
  assert.deepEqual(await (await fetch(recipesUrl)).json(), { recipes: [] });
  assert.equal((await fetch(`${recipesUrl}/${recipeId}`, { method: 'DELETE' })).status, 404);
  assert.equal((await fetch(`${url}/${id}`, { method: 'DELETE' })).status, 204);
  assert.deepEqual(await (await fetch(url)).json(), { supplies: [] });
  assert.equal((await fetch(`${url}/${id}`, { method: 'DELETE' })).status, 404);
  assert.equal((await fetch(`${url}/invalid`, { method: 'DELETE' })).status, 400);
  /** Simula la caída de MongoDB para verificar que no se filtren detalles internos. */
  repository.list = async function unavailable() { throw new Error('detalle interno privado'); };
  const unavailable = await fetch(url);
  assert.equal(unavailable.status, 503);
  assert.ok(!JSON.stringify(await unavailable.json()).includes('detalle interno privado'));
});
