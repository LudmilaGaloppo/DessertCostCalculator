import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import type { CostSettings, Packaging, Recipe, SaleQuoteCost, StickerSettings, Supply } from '@dessert-cost/shared';
import type { PackagingFormValues, QuoteFormValues } from '../types/packaging-form';
import { emptyPackagingForm, packagingInputFromForm, packagingToForm } from '../utils/packaging-form';
import { parseDecimal, validateDecimalField } from '../utils/ingredient-form';
import { calculateProductionCost, calculateSaleQuoteCost } from '../domain/costs';
import { listSupplies } from '../services/supplies';
import { listRecipes } from '../services/recipes';
import { getCostSettings } from '../services/settings';
import { getStickerSettings, listPackaging, savePackaging, saveStickerSettings } from '../services/packaging';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

interface StickerFormValues { name: string; purchaseQuantity: string; purchasePrice: string }
interface QuoteView { cost: SaleQuoteCost; recipeName: string; packagingName: string }

/** Presenta un error de React Hook Form junto al campo correspondiente. */
function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="field-error" role="alert">{message}</span> : null;
}

/** Administra envases, stickers y el costo de una cantidad de cookies. */
export default function PackagingCalculator() {
  const packagingForm = useForm<PackagingFormValues>({ defaultValues: emptyPackagingForm() });
  const stickerForm = useForm<StickerFormValues>({ defaultValues: { name: '', purchaseQuantity: '', purchasePrice: '' } });
  const quoteForm = useForm<QuoteFormValues>({ defaultValues: { recipeId: '', packagingId: '', requestedUnits: '' } });
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [settings, setSettings] = useState<CostSettings>({ hourlyRate: null });
  const [stickers, setStickers] = useState<StickerSettings>({ name: null, purchaseQuantity: null, purchasePrice: null });
  const [selectedPackagingId, setSelectedPackagingId] = useState('');
  const [result, setResult] = useState<QuoteView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const requestInProgress = useRef(false);

  // Cancela la carga si la persona cambia de sección antes de recibir los datos.
  useEffect(function loadInitialData() {
    const controller = new AbortController();
    void refreshData(controller.signal);
    return () => controller.abort();
  }, []);

  /** Recupera todos los datos necesarios para administrar y cotizar packaging. */
  async function refreshData(signal?: AbortSignal) {
    setLoading(true); setError(''); setResult(null);
    try {
      const [savedPackaging, savedRecipes, savedSupplies, costSettings, stickerSettings] = await Promise.all([
        listPackaging(signal), listRecipes(signal), listSupplies(signal), getCostSettings(signal), getStickerSettings(signal),
      ]);
      if (signal?.aborted) return;
      setPackaging(savedPackaging); setRecipes(savedRecipes); setSupplies(savedSupplies); setSettings(costSettings); setStickers(stickerSettings);
      stickerForm.reset({ name: stickerSettings.name ?? '', purchaseQuantity: stickerSettings.purchaseQuantity === null ? '' : String(stickerSettings.purchaseQuantity), purchasePrice: stickerSettings.purchasePrice === null ? '' : String(stickerSettings.purchasePrice) });
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }

  /** Limpia mensajes y resultados que quedaron desactualizados por una edición. */
  function clearFeedback() { setResult(null); setError(''); setMessage(''); }

  /** Prepara el formulario para crear otro envase. */
  function newPackaging() { packagingForm.reset(emptyPackagingForm()); setSelectedPackagingId(''); clearFeedback(); }

  /** Carga el envase seleccionado en el formulario de edición. */
  function loadPackaging(event: ChangeEvent<HTMLSelectElement>) {
    const selected = packaging.find((item) => item.id === event.target.value);
    if (!selected) { newPackaging(); return; }
    packagingForm.reset(packagingToForm(selected)); setSelectedPackagingId(selected.id); clearFeedback();
  }

  /** Guarda o actualiza los datos de compra y capacidad del envase. */
  async function submitPackaging(values: PackagingFormValues) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); clearFeedback();
    try {
      const saved = await savePackaging(packagingInputFromForm(values), selectedPackagingId || undefined);
      setPackaging((previous) => [...previous.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedPackagingId(saved.id); packagingForm.reset(packagingToForm(saved));
      setMessage('Envase guardado. Ya está disponible para cotizar.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el envase.'); }
    finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Guarda la compra compartida de stickers sin duplicarla en cada envase. */
  async function submitStickers(values: StickerFormValues) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); clearFeedback();
    try {
      const name = values.name.trim();
      if (!name) throw new Error('Ingresá el nombre del sticker.');
      const purchaseQuantity = parseDecimal(values.purchaseQuantity, 'la cantidad de stickers');
      const purchasePrice = parseDecimal(values.purchasePrice, 'el precio de los stickers');
      if (!Number.isInteger(purchaseQuantity) || purchaseQuantity <= 0) throw new Error('La cantidad de stickers debe ser un entero mayor que cero.');
      if (purchasePrice < 0) throw new Error('El precio de los stickers no puede ser negativo.');
      const saved = await saveStickerSettings(name, purchaseQuantity, purchasePrice);
      setStickers(saved); stickerForm.reset({ name: saved.name ?? '', purchaseQuantity: String(saved.purchaseQuantity), purchasePrice: String(saved.purchasePrice) });
      setMessage('Compra de stickers actualizada.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los stickers.'); }
    finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Relee precios vigentes y calcula productos, envases y stickers de la cotización. */
  async function calculateQuote(values: QuoteFormValues) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); clearFeedback();
    try {
      const [currentPackaging, currentRecipes, currentSupplies, currentSettings, currentStickers] = await Promise.all([
        listPackaging(), listRecipes(), listSupplies(), getCostSettings(), getStickerSettings(),
      ]);
      const recipe = currentRecipes.find((item) => item.id === values.recipeId);
      const selected = currentPackaging.find((item) => item.id === values.packagingId);
      if (!recipe) throw new Error('Elegí una receta guardada.');
      if (!selected) throw new Error('Elegí un envase guardado.');
      const requestedUnits = parseDecimal(values.requestedUnits, 'la cantidad de cookies');
      const production = calculateProductionCost(recipe, currentSupplies, currentSettings);
      const cost = calculateSaleQuoteCost(recipe, production, selected, currentStickers, requestedUnits);
      setPackaging(currentPackaging); setRecipes(currentRecipes); setSupplies(currentSupplies); setSettings(currentSettings); setStickers(currentStickers);
      setResult({ cost, recipeName: recipe.name, packagingName: selected.name });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo calcular la cotización.'); }
    finally { requestInProgress.current = false; setBusy(false); }
  }

  return <main id="main">
    <div className="page-heading"><p className="eyebrow">PACKAGING Y COTIZACIÓN</p><h1>Del costo de la tanda a la venta.</h1><p>Sumá bolsas, cajas y stickers según la cantidad de cookies elegida.</p></div>
    <div className="calculator-layout">
      <section className="form-card">
        <form onSubmit={packagingForm.handleSubmit(submitPackaging)} onChange={clearFeedback} noValidate>
          <fieldset className="form-controls" disabled={busy || loading}>
            <div className="card-heading"><h2>{selectedPackagingId ? 'Editar envase' : 'Nuevo envase'}</h2><button type="button" className="text-button" onClick={newPackaging}>Nuevo</button></div>
            <label className="field">Envase guardado<select value={selectedPackagingId} onChange={loadPackaging}><option value="">Nuevo envase</option>{packaging.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="field price-field">Nombre<input {...packagingForm.register('name', { required: 'Ingresá el nombre del envase.' })} placeholder="Caja con visor 25 × 20 × 8 cm" aria-invalid={Boolean(packagingForm.formState.errors.name)} /><FieldError id="packaging-name-error" message={packagingForm.formState.errors.name?.message} /></label>
            <div className="field-row price-field"><label className="field">Tipo<select {...packagingForm.register('kind')}><option value="individual">Individual</option><option value="box">Caja</option></select></label><label className="field">Capacidad en cookies<input {...packagingForm.register('capacity', { validate: (value) => validateDecimalField(value, 'la capacidad', true) })} inputMode="numeric" aria-invalid={Boolean(packagingForm.formState.errors.capacity)} /><FieldError id="capacity-error" message={packagingForm.formState.errors.capacity?.message} /></label></div>
            <div className="field-row price-field"><label className="field">Cantidad comprada<input {...packagingForm.register('purchaseQuantity', { validate: (value) => validateDecimalField(value, 'la cantidad comprada', true) })} inputMode="numeric" aria-invalid={Boolean(packagingForm.formState.errors.purchaseQuantity)} /><FieldError id="packaging-quantity-error" message={packagingForm.formState.errors.purchaseQuantity?.message} /></label><label className="field">Precio total (ARS)<input {...packagingForm.register('purchasePrice', { validate: (value) => validateDecimalField(value, 'el precio total') })} inputMode="decimal" aria-invalid={Boolean(packagingForm.formState.errors.purchasePrice)} /><FieldError id="packaging-price-error" message={packagingForm.formState.errors.purchasePrice?.message} /></label></div>
            <label className="field price-field">Stickers por envase<input {...packagingForm.register('stickersPerPackage', { validate: (value) => validateDecimalField(value, 'los stickers por envase') })} inputMode="numeric" aria-invalid={Boolean(packagingForm.formState.errors.stickersPerPackage)} /><FieldError id="stickers-per-package-error" message={packagingForm.formState.errors.stickersPerPackage?.message} /></label>
            <button type="submit" className="primary-button save-button">{selectedPackagingId ? 'Actualizar envase' : 'Guardar envase'}</button>
          </fieldset>
        </form>
        <form className="nested-card" onSubmit={stickerForm.handleSubmit(submitStickers)} noValidate>
          <fieldset className="form-controls" disabled={busy || loading}><h2>Compra de stickers</h2><label className="field">Nombre<input {...stickerForm.register('name', { required: 'Ingresá el nombre.' })} aria-invalid={Boolean(stickerForm.formState.errors.name)} /><FieldError id="sticker-name-error" message={stickerForm.formState.errors.name?.message} /></label><div className="field-row price-field"><label className="field">Cantidad comprada<input {...stickerForm.register('purchaseQuantity', { validate: (value) => validateDecimalField(value, 'la cantidad de stickers', true) })} inputMode="numeric" aria-invalid={Boolean(stickerForm.formState.errors.purchaseQuantity)} /><FieldError id="sticker-quantity-error" message={stickerForm.formState.errors.purchaseQuantity?.message} /></label><label className="field">Precio total (ARS)<input {...stickerForm.register('purchasePrice', { validate: (value) => validateDecimalField(value, 'el precio de los stickers') })} inputMode="decimal" aria-invalid={Boolean(stickerForm.formState.errors.purchasePrice)} /><FieldError id="sticker-price-error" message={stickerForm.formState.errors.purchasePrice?.message} /></label></div><button type="submit" className="secondary-button save-button">Guardar stickers</button></fieldset>
        </form>
        {error && <p className="field-error" role="alert">{error}</p>}{message && <p className="save-message" role="status">{message}</p>}
      </section>
      <aside className="result-column">
        <form className="catalog-card" onSubmit={quoteForm.handleSubmit(calculateQuote)} noValidate><fieldset className="form-controls" disabled={busy || loading}><div className="card-heading"><h2>Calcular una venta</h2><button type="button" className="text-button" onClick={() => void refreshData()}>Actualizar datos</button></div><label className="field">Receta<select {...quoteForm.register('recipeId', { required: 'Elegí una receta.' })} aria-invalid={Boolean(quoteForm.formState.errors.recipeId)}><option value="">Elegir receta</option>{recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}</select><FieldError id="quote-recipe-error" message={quoteForm.formState.errors.recipeId?.message} /></label><label className="field price-field">Presentación<select {...quoteForm.register('packagingId', { required: 'Elegí una presentación.' })} aria-invalid={Boolean(quoteForm.formState.errors.packagingId)}><option value="">Elegir envase</option>{packaging.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><FieldError id="quote-packaging-error" message={quoteForm.formState.errors.packagingId?.message} /></label><label className="field price-field">Cantidad de cookies<input {...quoteForm.register('requestedUnits', { validate: (value) => validateDecimalField(value, 'la cantidad de cookies', true) })} inputMode="numeric" aria-invalid={Boolean(quoteForm.formState.errors.requestedUnits)} /><FieldError id="quote-units-error" message={quoteForm.formState.errors.requestedUnits?.message} /></label><button type="submit" className="primary-button save-button">Calcular costo</button></fieldset></form>
        <section className="result-card" aria-live="polite"><p className="eyebrow">COSTO DE LA COTIZACIÓN</p>{result ? <><h2 className="result-amount">{pesos.format(result.cost.quotedCost)}</h2><p className="result-description">{result.cost.requestedUnits} cookies de {result.recipeName} · {result.packagingName}</p><dl className="result-breakdown"><div><dt>Productos</dt><dd>{pesos.format(result.cost.productsCost)}</dd></div><div><dt>{result.cost.packageCount} envase(s)</dt><dd>{pesos.format(result.cost.containersCost)}</dd></div><div><dt>{result.cost.stickerCount} sticker(s)</dt><dd>{result.cost.stickerCost === null ? 'Pendiente' : pesos.format(result.cost.stickerCost)}</dd></div><div><dt>Packaging total</dt><dd>{pesos.format(result.cost.packagingCost)}</dd></div></dl>{result.cost.isPartial && <p className="pending-cost">Falta completar: {result.cost.missingInputs.join(' y ')}. El costo mostrado es parcial.</p>}<p className="result-footnote">Este valor es un costo, todavía no es el precio de venta.</p></> : <><h2 className="result-placeholder">Elegí receta, envase y cantidad.</h2><p className="result-description">La caja no calcula múltiples unidades automáticamente cuando se supera su capacidad.</p></>}</section>
        <section className="scope-note"><h2>Regla actual</h2><p>Una bolsa y un sticker por cookie individual. Una caja y un sticker para cualquier cantidad que no supere su capacidad.</p></section>
      </aside>
    </div>
  </main>;
}
