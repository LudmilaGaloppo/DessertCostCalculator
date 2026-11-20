import express, { type Request, type Response, type NextFunction } from 'express';
import { InputError, validateSupplyInput } from './supplies/validation.js';
import type { SupplyRepository } from './supplies/repository.js';
import type { RecipeRepository } from './recipes/repository.js';
import { validateRecipeInput } from './recipes/validation.js';
import type { CostSettingsRepository } from './settings/repository.js';
import { validateHourlyRate } from './settings/validation.js';
import type { PackagingRepository } from './packaging/repository.js';
import { validatePackagingInput } from './packaging/validation.js';
import type { StickerSettingsRepository } from './packaging/sticker-settings.js';
import { validateStickerSettings } from './packaging/sticker-settings.js';

/** Crea la API local de insumos y recetas con repositorios reemplazables para las pruebas. */
export function createApp(repository: SupplyRepository, recipes: RecipeRepository, settings: CostSettingsRepository, packaging: PackagingRepository, stickers: StickerSettingsRepository) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  /** Devuelve los insumos guardados. */
  async function listSupplies(_request: Request, response: Response) {
    response.json({ supplies: await repository.list() });
  }

  /** Valida e inserta un insumo nuevo; ignora cualquier ID enviado por el cliente. */
  async function createSupply(request: Request, response: Response) {
    if (!request.is('application/json')) { response.status(415).json({ message: 'Enviá JSON.' }); return; }
    const input = validateSupplyInput(request.body);
    response.status(201).json({ supply: await repository.create(input) });
  }

  /** Valida el ID y los datos antes de actualizar un insumo existente. */
  async function updateSupply(request: Request, response: Response) {
    if (!request.is('application/json')) { response.status(415).json({ message: 'Enviá JSON.' }); return; }
    const id = request.params.id;
    if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) throw new InputError('El identificador del insumo no es válido.');
    const supply = await repository.update(id, validateSupplyInput(request.body));
    if (!supply) { response.status(404).json({ message: 'El insumo no existe.' }); return; }
    response.json({ supply });
  }

  /** Lista las recetas guardadas sin almacenar ni devolver costos históricos. */
  async function listRecipes(_request: Request, response: Response) {
    response.json({ recipes: await recipes.list() });
  }

  /** Valida las referencias al catálogo antes de guardar una receta nueva. */
  async function createRecipe(request: Request, response: Response) {
    if (!request.is('application/json')) { response.status(415).json({ message: 'Enviá JSON.' }); return; }
    const input = validateRecipeInput(request.body, await repository.list());
    response.status(201).json({ recipe: await recipes.create(input) });
  }

  /** Actualiza el contenido completo de una receta identificada por su ID. */
  async function updateRecipe(request: Request, response: Response) {
    if (!request.is('application/json')) { response.status(415).json({ message: 'Enviá JSON.' }); return; }
    const id = request.params.id;
    if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) throw new InputError('El identificador de la receta no es válido.');
    const input = validateRecipeInput(request.body, await repository.list());
    const recipe = await recipes.update(id, input);
    if (!recipe) { response.status(404).json({ message: 'La receta no existe.' }); return; }
    response.json({ recipe });
  }

  /** Devuelve la tarifa general o null si todavía no fue configurada. */
  async function getCostSettings(_request: Request, response: Response) {
    response.json({ settings: await settings.get() });
  }

  /** Valida y guarda el valor general de la hora de trabajo. */
  async function updateCostSettings(request: Request, response: Response) {
    if (!request.is('application/json')) { response.status(415).json({ message: 'Enviá JSON.' }); return; }
    response.json({ settings: await settings.update(validateHourlyRate(request.body)) });
  }

  /** Devuelve el catálogo de envases disponibles para cotizar. */
  async function listPackaging(_request: Request, response: Response) {
    response.json({ packaging: await packaging.list() });
  }

  /** Valida y crea un envase sin aceptar identificadores del cliente. */
  async function createPackaging(request: Request, response: Response) {
    if (!request.is('application/json')) { response.status(415).json({ message: 'Enviá JSON.' }); return; }
    response.status(201).json({ packaging: await packaging.create(validatePackagingInput(request.body)) });
  }

  /** Valida y actualiza un envase existente. */
  async function updatePackaging(request: Request, response: Response) {
    if (!request.is('application/json')) { response.status(415).json({ message: 'Enviá JSON.' }); return; }
    const id = request.params.id;
    if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) throw new InputError('El identificador del envase no es válido.');
    const saved = await packaging.update(id, validatePackagingInput(request.body));
    if (!saved) { response.status(404).json({ message: 'El envase no existe.' }); return; }
    response.json({ packaging: saved });
  }

  /** Devuelve la compra de stickers compartida por bolsas y cajas. */
  async function getStickerSettings(_request: Request, response: Response) {
    response.json({ stickers: await stickers.get() });
  }

  /** Valida y guarda la compra usada para calcular el costo unitario del sticker. */
  async function updateStickerSettings(request: Request, response: Response) {
    if (!request.is('application/json')) { response.status(415).json({ message: 'Enviá JSON.' }); return; }
    response.json({ stickers: await stickers.update(validateStickerSettings(request.body)) });
  }

  /** Informa que la ruta solicitada no pertenece a esta API. */
  function notFound(_request: Request, response: Response) {
    response.status(404).json({ message: 'Ruta no encontrada.' });
  }

  /** Traduce errores a respuestas JSON sin exponer conexiones, credenciales ni detalles internos. */
  function handleError(error: unknown, _request: Request, response: Response, _next: NextFunction) {
    if (error instanceof InputError) { response.status(400).json({ message: error.message }); return; }
    const type = error && typeof error === 'object' && 'type' in error ? error.type : '';
    if (type === 'entity.parse.failed') { response.status(400).json({ message: 'El JSON enviado no es válido.' }); return; }
    if (type === 'entity.too.large') { response.status(413).json({ message: 'La solicitud es demasiado grande.' }); return; }
    response.status(503).json({ message: 'No se pudo acceder a los datos. Verificá que MongoDB esté disponible.' });
  }

  app.get('/api/supplies', listSupplies);
  app.post('/api/supplies', createSupply);
  app.put('/api/supplies/:id', updateSupply);
  app.get('/api/recipes', listRecipes);
  app.post('/api/recipes', createRecipe);
  app.put('/api/recipes/:id', updateRecipe);
  app.get('/api/settings/costs', getCostSettings);
  app.put('/api/settings/costs', updateCostSettings);
  app.get('/api/packaging', listPackaging);
  app.post('/api/packaging', createPackaging);
  app.put('/api/packaging/:id', updatePackaging);
  app.get('/api/settings/stickers', getStickerSettings);
  app.put('/api/settings/stickers', updateStickerSettings);
  app.use(notFound);
  app.use(handleError);
  return app;
}
