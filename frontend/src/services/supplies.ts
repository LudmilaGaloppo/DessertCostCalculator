import type { Supply, SupplyInput } from '@dessert-cost/shared';

/** Envía una petición a la API local y transforma respuestas fallidas en mensajes para la pantalla. */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...options, signal: options.signal ?? AbortSignal.timeout(8000) });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error('No se pudo conectar con el catálogo. Verificá que la API esté iniciada.');
  }
  const data: unknown = await response.json().catch(emptyResponse);
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
      ? data.message : 'No se pudo acceder al catálogo. Verificá que la API esté iniciada.';
    throw new Error(message);
  }
  if (data === null) throw new Error('La API devolvió una respuesta inválida.');
  return data as T;
}

/** Mantiene controlado el error cuando el proxy responde sin contenido JSON. */
function emptyResponse(): null { return null; }

/** Obtiene el catálogo persistido en MongoDB; permite cancelar la carga al salir de la pantalla. */
export async function listSupplies(signal?: AbortSignal): Promise<Supply[]> {
  const response = await request<{ supplies: Supply[] }>('/api/supplies', { signal });
  return response.supplies;
}

/** Crea un insumo o actualiza el seleccionado, enviando únicamente sus datos de compra. */
export async function saveSupply(input: SupplyInput, id?: string): Promise<Supply> {
  const response = await request<{ supply: Supply }>(id ? `/api/supplies/${encodeURIComponent(id)}` : '/api/supplies', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return response.supply;
}
