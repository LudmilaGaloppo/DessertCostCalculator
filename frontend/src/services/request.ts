/** Envía una petición a la API local y transforma respuestas fallidas en mensajes para la pantalla. */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...options, signal: options.signal ?? AbortSignal.timeout(8000) });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error('No se pudo conectar con la API. Verificá que la API esté iniciada.');
  }
  const data: unknown = await response.json().catch(emptyResponse);
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
      ? data.message : 'No se pudo acceder a los datos. Verificá que la API esté iniciada.';
    throw new Error(message);
  }
  if (data === null) throw new Error('La API devolvió una respuesta inválida.');
  return data as T;
}

/** Mantiene controlado el error cuando el proxy responde sin contenido JSON. */
function emptyResponse(): null { return null; }

