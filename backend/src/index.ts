import mongoose from 'mongoose';
import { createApp } from './app.js';
import { createSupplyRepository } from './supplies/repository.js';
import { createRecipeRepository } from './recipes/repository.js';
import { createCostSettingsRepository } from './settings/repository.js';
import { createPackagingRepository } from './packaging/repository.js';
import { createStickerSettingsRepository } from './packaging/sticker-settings.js';

/** Abre MongoDB y recién después inicia la API, accesible únicamente desde esta computadora. */
async function startServer() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/dessert_cost_calculator';
  const port = Number(process.env.API_PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto inválido.');
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
  const app = createApp(createSupplyRepository(connection), createRecipeRepository(connection), createCostSettingsRepository(connection), createPackagingRepository(connection), createStickerSettingsRepository(connection));
  const server = app.listen(port, '127.0.0.1');

  /** Informa la dirección de la API cuando el puerto ya está disponible. */
  function onListening() { console.log(`API local disponible en http://127.0.0.1:${port}`); }

  /** Cierra las solicitudes y la conexión de base de datos al detener la API. */
  function shutdown() {
    server.close();
    void connection.close();
  }

  /** Cierra la conexión si no se pudo reservar el puerto de la API. */
  function onServerError() {
    console.error('No se pudo iniciar la API. Revisá que el puerto esté disponible.');
    void connection.close();
    process.exitCode = 1;
  }

  server.on('listening', onListening);
  server.on('error', onServerError);
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

/** Informa un fallo de conexión sin imprimir la URI de MongoDB. */
function reportStartupError() {
  console.error('No se pudo iniciar la API. Revisá MongoDB local, MONGODB_URI y API_PORT.');
  process.exitCode = 1;
}

void startServer().catch(reportStartupError);
