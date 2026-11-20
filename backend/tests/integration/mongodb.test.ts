import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';
import { createSupplyRepository } from '../../src/supplies/repository.js';
import type { Supply } from '@dessert-cost/shared';

test('MongoDB local persiste insumos, permite releerlos desde otra conexión y actualiza por ID', async (context) => {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/dessert_cost_calculator';
  // dbName reemplaza la base de la URI: nunca se escribe en el catálogo de la usuaria.
  const dbName = `dessert_cost_test_${randomUUID().replaceAll('-', '')}`;
  const connection = await mongoose.createConnection(uri, { dbName, serverSelectionTimeoutMS: 5000 }).asPromise();
  const server = createApp(createSupplyRepository(connection)).listen(0, '127.0.0.1');
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
  assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...input, purchaseQuantity: 0 }) })).status, 400);
  assert.equal(await connection.collection('supplies').countDocuments(), 1);
});
