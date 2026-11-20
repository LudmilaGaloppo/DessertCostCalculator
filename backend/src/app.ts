import express, { type Request, type Response, type NextFunction } from 'express';
import { InputError, validateSupplyInput } from './supplies/validation.js';
import type { SupplyRepository } from './supplies/repository.js';

/** Crea la API local del catálogo; recibe el repositorio para poder probarla de forma aislada. */
export function createApp(repository: SupplyRepository) {
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
    response.status(503).json({ message: 'No se pudo acceder al catálogo. Verificá que MongoDB esté disponible.' });
  }

  app.get('/api/supplies', listSupplies);
  app.post('/api/supplies', createSupply);
  app.put('/api/supplies/:id', updateSupply);
  app.use(notFound);
  app.use(handleError);
  return app;
}
