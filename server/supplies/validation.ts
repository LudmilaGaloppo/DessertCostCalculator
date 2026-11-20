import type { SupplyInput, Unit } from '../../src/types/costs.js';

/** Identifica un error de entrada que la API debe devolver como HTTP 400. */
export class InputError extends Error {}

/** Valida la entrada externa sin convertir texto a números y devuelve solo los campos permitidos. */
export function validateSupplyInput(body: unknown): SupplyInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Enviá los datos de un insumo.');
  const values = body as Record<string, unknown>;
  const { name, purchaseQuantity, purchasePrice, purchaseUnit } = values;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
    throw new InputError('El nombre debe tener entre 1 y 120 caracteres.');
  }
  if (typeof purchaseQuantity !== 'number' || !Number.isFinite(purchaseQuantity) || purchaseQuantity <= 0) {
    throw new InputError('La cantidad comprada debe ser un número mayor que cero.');
  }
  if (typeof purchasePrice !== 'number' || !Number.isFinite(purchasePrice) || purchasePrice < 0) {
    throw new InputError('El precio debe ser un número no negativo.');
  }
  if (typeof purchaseUnit !== 'string' || !['g', 'kg', 'ml', 'l', 'unit'].includes(purchaseUnit)) {
    throw new InputError('Elegí una unidad válida: g, kg, ml, l o unit.');
  }
  const unit = purchaseUnit as Unit;
  return { name: name.trim(), purchaseQuantity, purchasePrice, purchaseUnit: unit };
}
