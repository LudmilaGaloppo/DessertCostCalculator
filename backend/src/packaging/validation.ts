import type { PackagingInput, PackagingKind, Unit } from '@dessert-cost/shared';
import { InputError } from '../supplies/validation.js';

/** Valida un envase externo y devuelve únicamente los campos persistibles. */
export function validatePackagingInput(body: unknown): PackagingInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Enviá los datos de un envase.');
  const { name, kind, purchaseQuantity, purchasePrice, capacity, capacityUnit, stickersPerPackage } = body as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 160) throw new InputError('El nombre debe tener entre 1 y 160 caracteres.');
  if (kind !== 'individual' && kind !== 'box') throw new InputError('Elegí si es un envase individual o una caja.');
  if (typeof purchaseQuantity !== 'number' || !Number.isInteger(purchaseQuantity) || purchaseQuantity <= 0) throw new InputError('La cantidad comprada debe ser un entero mayor que cero.');
  if (typeof purchasePrice !== 'number' || !Number.isFinite(purchasePrice) || purchasePrice < 0) throw new InputError('El precio de compra debe ser un número no negativo.');
  if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity <= 0) throw new InputError('La capacidad debe ser un entero mayor que cero.');
  if (capacityUnit !== 'unit') throw new InputError('Por ahora la capacidad de los envases debe expresarse en unidades.');
  if (kind === 'individual' && capacity !== 1) throw new InputError('Un envase individual debe contener una unidad.');
  if (typeof stickersPerPackage !== 'number' || !Number.isInteger(stickersPerPackage) || stickersPerPackage < 0) throw new InputError('La cantidad de stickers por envase debe ser un entero no negativo.');
  return { name: name.trim(), kind: kind as PackagingKind, purchaseQuantity, purchasePrice, capacity, capacityUnit: capacityUnit as Unit, stickersPerPackage };
}
