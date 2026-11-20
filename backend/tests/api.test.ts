import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import type { SupplyRepository } from '../src/supplies/repository.js';
import type { RecipeRepository } from '../src/recipes/repository.js';
import type { Recipe, Supply } from '@dessert-cost/shared';

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
  };
  const savedRecipes: Recipe[] = [];
  const recipeRepository: RecipeRepository = {
    /** Simula la lista de recetas guardadas para comprobar su contrato HTTP. */
    async list() { return savedRecipes; },
    /** Conserva una receta nueva sin copiar precios del catálogo. */
    async create(value) { const recipe = { ...value, id: recipeId }; savedRecipes.push(recipe); return recipe; },
    /** Simula una receta válida que ya no existe. */
    async update() { return null; },
  };
  const server = createApp(repository, recipeRepository).listen(0, '127.0.0.1');
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
  const recipeInput = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit', ingredients: [{ supplyId: id, quantity: 375, unit: 'g' }] };
  const recipesUrl = `http://127.0.0.1:${address.port}/api/recipes`;
  const recipeCreated = await fetch(recipesUrl, { method: 'POST', headers, body: JSON.stringify(recipeInput) });
  assert.equal(recipeCreated.status, 201);
  assert.deepEqual(await recipeCreated.json(), { recipe: { ...recipeInput, id: recipeId } });
  assert.deepEqual(await (await fetch(recipesUrl)).json(), { recipes: [{ ...recipeInput, id: recipeId }] });
  assert.equal((await fetch(recipesUrl, { method: 'POST', headers, body: JSON.stringify({ ...recipeInput, ingredients: [{ ...recipeInput.ingredients[0], unit: 'ml' }] }) })).status, 400);
  assert.equal((await fetch(`${url}/invalid`, { method: 'PUT', headers, body: JSON.stringify(input) })).status, 400);
  assert.equal((await fetch(`${url}/${id}`, { method: 'PUT', headers, body: JSON.stringify(input) })).status, 404);
  /** Simula la caída de MongoDB para verificar que no se filtren detalles internos. */
  repository.list = async function unavailable() { throw new Error('detalle interno privado'); };
  const unavailable = await fetch(url);
  assert.equal(unavailable.status, 503);
  assert.ok(!JSON.stringify(await unavailable.json()).includes('detalle interno privado'));
});
