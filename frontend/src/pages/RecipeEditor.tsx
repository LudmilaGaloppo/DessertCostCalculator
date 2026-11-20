import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import type { CostSettings, ProductionCost, Recipe, Supply } from '@dessert-cost/shared';
import type { RecipeFormValues } from '../types/recipe-form';
import { emptyRecipeForm, recipeInputFromForm, recipeToForm } from '../utils/recipe-form';
import { validateDecimalField } from '../utils/ingredient-form';
import { calculateProductionCost } from '../domain/costs';
import { listSupplies } from '../services/supplies';
import { deleteRecipe, listRecipes, saveRecipe } from '../services/recipes';
import { getCostSettings, saveEnergySettings, saveHourlyRate } from '../services/settings';
import { parseDecimal } from '../utils/ingredient-form';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 6 });

/** Ofrece las unidades disponibles para cantidades y rendimiento. */
function UnitOptions() {
  return <><option value="g">Gramos (g)</option><option value="kg">Kilogramos (kg)</option><option value="ml">Mililitros (ml)</option><option value="l">Litros (l)</option><option value="unit">Unidades</option></>;
}

/** Muestra errores de validación junto al campo correspondiente. */
function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="field-error" role="alert">{message}</span> : null;
}

/** Administra recetas con varias filas y calcula con precios recién consultados. */
export default function RecipeEditor() {
  const { register, control, handleSubmit, reset, clearErrors, formState: { errors } } = useForm<RecipeFormValues>({ defaultValues: emptyRecipeForm() });
  const { register: registerSettings, handleSubmit: handleSettingsSubmit, reset: resetSettings, formState: { errors: settingsErrors } } = useForm<{ hourlyRate: string }>({ defaultValues: { hourlyRate: '' } });
  const energyForm = useForm<{ gasDailyAverage: string; electricityDailyAverage: string }>({ defaultValues: { gasDailyAverage: '', electricityDailyAverage: '' } });
  // useFieldArray mantiene un ID estable por fila aunque se agreguen o quiten ingredientes.
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<CostSettings>({ hourlyRate: null, gasDailyAverage: null, electricityDailyAverage: null });
  const [result, setResult] = useState<ProductionCost | null>(null);
  const requestInProgress = useRef(false);

  // Cancela la consulta si se cambia de sección antes de recibir la respuesta.
  useEffect(function loadInitialData() {
    const controller = new AbortController();
    void refreshData(controller.signal);
    return () => controller.abort();
  }, []);

  /** Carga catálogo y recetas; un fallo conserva el formulario para reintentar. */
  async function refreshData(signal?: AbortSignal) {
    setLoading(true); setError(''); setResult(null);
    try {
      const [currentSupplies, currentRecipes, currentSettings] = await Promise.all([listSupplies(signal), listRecipes(signal), getCostSettings(signal)]);
      if (signal?.aborted) return;
      setSupplies(currentSupplies); setRecipes(currentRecipes); setSettings(currentSettings);
      resetSettings({ hourlyRate: currentSettings.hourlyRate === null ? '' : String(currentSettings.hourlyRate) });
      energyForm.reset({ gasDailyAverage: currentSettings.gasDailyAverage === null ? '' : String(currentSettings.gasDailyAverage), electricityDailyAverage: currentSettings.electricityDailyAverage === null ? '' : String(currentSettings.electricityDailyAverage) });
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }

  /** Invalida el subtotal cuando cambian los datos del formulario. */
  function clearResult() { setResult(null); setMessage(''); setError(''); }

  /** Prepara un formulario vacío sin modificar recetas guardadas. */
  function newRecipe() { reset(emptyRecipeForm()); setSelectedId(''); clearResult(); }

  /** Carga la receta seleccionada para editarla. */
  function loadRecipe(event: ChangeEvent<HTMLSelectElement>) {
    const recipe = recipes.find((item) => item.id === event.target.value);
    if (!recipe) { newRecipe(); return; }
    reset(recipeToForm(recipe)); setSelectedId(recipe.id); clearResult();
  }

  /** Agrega una fila vacía al formulario. */
  function addIngredient() { append({ supplyId: '', quantity: '', unit: 'g' }); clearResult(); }

  /** Quita una fila y descarta el subtotal anterior. */
  function removeIngredient(index: number) { remove(index); clearResult(); }

  /** Valida y guarda la tarifa compartida por todas las recetas. */
  async function updateHourlyRate(values: { hourlyRate: string }) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); setError(''); setMessage(''); setResult(null);
    try {
      const value = parseDecimal(values.hourlyRate, 'el valor de la hora');
      if (value <= 0) throw new Error('El valor de la hora debe ser mayor que cero.');
      const saved = await saveHourlyRate(value);
      setSettings(saved); resetSettings({ hourlyRate: String(saved.hourlyRate) });
      setMessage('Valor de la hora actualizado. Volvé a calcular la receta.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el valor de la hora.');
    } finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Guarda los promedios diarios usados para estimar gas y electricidad. */
  async function updateEnergySettings(values: { gasDailyAverage: string; electricityDailyAverage: string }) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); setError(''); setMessage(''); setResult(null);
    try {
      const gasDailyAverage = parseDecimal(values.gasDailyAverage, 'el promedio diario de gas');
      const electricityDailyAverage = parseDecimal(values.electricityDailyAverage, 'el promedio diario de electricidad');
      if (gasDailyAverage <= 0 || electricityDailyAverage <= 0) throw new Error('Los promedios diarios deben ser mayores que cero.');
      const saved = await saveEnergySettings(gasDailyAverage, electricityDailyAverage);
      setSettings(saved);
      energyForm.reset({ gasDailyAverage: String(saved.gasDailyAverage), electricityDailyAverage: String(saved.electricityDailyAverage) });
      setMessage('Promedios de energía actualizados. Volvé a calcular la receta.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los promedios de energía.');
    } finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Valida, calcula y opcionalmente persiste la receta. */
  async function processRecipe(values: RecipeFormValues, persist: boolean) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); clearResult(); clearErrors();
    try {
      const currentSupplies = await listSupplies();
      setSupplies(currentSupplies);
      const input = recipeInputFromForm(values, currentSupplies);
      const calculated = calculateProductionCost(input, currentSupplies, settings);
      if (persist) {
        const saved = await saveRecipe(input, selectedId || undefined);
        setRecipes((previous) => [...previous.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedId(saved.id); reset(recipeToForm(saved));
        setMessage('Receta guardada. Podés recuperarla desde la lista.');
      }
      setResult(calculated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo procesar la receta.');
    } finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Calcula el subtotal sin guardar la receta. */
  async function calculate(values: RecipeFormValues) { await processRecipe(values, false); }

  /** Guarda o actualiza la receta y muestra su subtotal. */
  async function save(values: RecipeFormValues) { await processRecipe(values, true); }

  /** Pide confirmación y elimina la receta seleccionada sin borrar sus insumos. */
  async function handleDeleteRecipe() {
    const selected = recipes.find((recipe) => recipe.id === selectedId);
    if (!selected || requestInProgress.current) return;
    if (!window.confirm(`¿Eliminar la receta “${selected.name}”? Los insumos del catálogo se conservarán.`)) return;
    requestInProgress.current = true; setBusy(true); setError(''); setMessage(''); setResult(null);
    try {
      await deleteRecipe(selected.id);
      setRecipes((current) => current.filter((recipe) => recipe.id !== selected.id));
      newRecipe();
      setMessage(`Se eliminó la receta “${selected.name}”.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la receta.');
    } finally { requestInProgress.current = false; setBusy(false); }
  }

  return <main id="main">
    <div className="page-heading"><p className="eyebrow">TUS RECETAS</p><h1>El costo de cada tanda.</h1><p>Combiná insumos del catálogo y definí cuánto rinde tu receta.</p></div>
    <div className="calculator-layout">
      <form className="form-card" onSubmit={handleSubmit(calculate)} onChange={clearResult} noValidate aria-label="Editar receta">
        <fieldset className="form-controls" disabled={busy || loading}>
          <div className="card-heading"><h2>{selectedId ? 'Editar receta' : 'Nueva receta'}</h2><button type="button" className="text-button" onClick={newRecipe}>Nueva receta</button></div>
          <label className="field">Nombre de la receta<input {...register('name', { required: 'Ingresá un nombre.', maxLength: { value: 120, message: 'Usá hasta 120 caracteres.' } })} placeholder="Cookies con chocolate" aria-invalid={Boolean(errors.name)} aria-describedby="recipe-name-error" /><FieldError id="recipe-name-error" message={errors.name?.message} /></label>
          <fieldset><legend>Rendimiento de la tanda</legend><div className="field-row">
            <label className="field">Cantidad producida<input {...register('yieldQuantity', { validate: (value) => validateDecimalField(value, 'el rendimiento', true) })} inputMode="decimal" placeholder="12" aria-invalid={Boolean(errors.yieldQuantity)} aria-describedby="yield-error" /><FieldError id="yield-error" message={errors.yieldQuantity?.message} /></label>
            <label className="field">Unidad de rendimiento<select {...register('yieldUnit')}><UnitOptions /></select></label>
          </div></fieldset>
          <fieldset><legend>Mano de obra</legend><p className="section-help">Ingresá las horas atribuibles a una tanda. Podés dejarlo pendiente sin convertirlo en cero.</p>
            <label className="field">Horas de trabajo<input {...register('workingHours', { validate: (value) => value.trim() === '' || validateDecimalField(value, 'las horas de trabajo') })} inputMode="decimal" placeholder="3" aria-invalid={Boolean(errors.workingHours)} aria-describedby="working-hours-error" /><FieldError id="working-hours-error" message={errors.workingHours?.message} /></label>
          </fieldset>
          <fieldset><legend>Energía de la tanda</legend><p className="section-help">Incluí el precalentado dentro del tiempo de horno. Los intervalos de batido se suman.</p><div className="field-row">
            <label className="field">Horno a gas (minutos)<input {...register('gasOvenMinutes', { validate: (value) => value.trim() === '' || validateDecimalField(value, 'los minutos de horno') })} inputMode="decimal" placeholder="90" aria-invalid={Boolean(errors.gasOvenMinutes)} /><FieldError id="gas-minutes-error" message={errors.gasOvenMinutes?.message} /></label>
            <label className="field">Batidora (minutos)<input {...register('electricMixerMinutes', { validate: (value) => value.trim() === '' || validateDecimalField(value, 'los minutos de batidora') })} inputMode="decimal" placeholder="5" aria-invalid={Boolean(errors.electricMixerMinutes)} /><FieldError id="electric-minutes-error" message={errors.electricMixerMinutes?.message} /></label>
          </div></fieldset>
          <fieldset><legend>Ingredientes</legend><p className="section-help">Elegí insumos guardados. Por ejemplo, usá 375 g de una harina comprada en kg.</p>
            {fields.map((field, index) => <fieldset className="ingredient-row" key={field.id}><legend>Ingrediente {index + 1}</legend>
              <label className="field">Insumo<select {...register(`ingredients.${index}.supplyId`, { required: 'Elegí un insumo.' })} aria-invalid={Boolean(errors.ingredients?.[index]?.supplyId)} aria-describedby={`supply-error-${index}`}><option value="">Seleccionar insumo</option>{supplies.map((supply) => <option key={supply.id} value={supply.id}>{supply.name} · compra en {supply.purchaseUnit}</option>)}</select><FieldError id={`supply-error-${index}`} message={errors.ingredients?.[index]?.supplyId?.message} /></label>
              <div className="field-row price-field"><label className="field">Cantidad utilizada<input {...register(`ingredients.${index}.quantity`, { validate: (value) => validateDecimalField(value, 'la cantidad utilizada', true) })} inputMode="decimal" aria-invalid={Boolean(errors.ingredients?.[index]?.quantity)} aria-describedby={`quantity-error-${index}`} /><FieldError id={`quantity-error-${index}`} message={errors.ingredients?.[index]?.quantity?.message} /></label><label className="field">Unidad de uso<select {...register(`ingredients.${index}.unit`)}><UnitOptions /></select></label></div>
              <button type="button" className="text-button" onClick={() => removeIngredient(index)} disabled={fields.length === 1}>Quitar ingrediente</button>
            </fieldset>)}
            <button type="button" className="secondary-button" onClick={addIngredient} disabled={fields.length >= 100}>Agregar ingrediente</button>
          </fieldset>
          <p className="decimal-help">Podés usar coma o punto decimal, sin separador de miles.</p>
          <div className="form-actions"><button type="submit" className="secondary-button">Calcular subtotal</button><button type="button" className="primary-button" onClick={handleSubmit(save)}>{selectedId ? 'Guardar cambios' : 'Guardar receta'}</button></div>
          {selectedId && <button type="button" className="danger-button save-button" onClick={handleDeleteRecipe}>Eliminar receta</button>}
        </fieldset>
        {busy && <p role="status">Procesando receta…</p>}{error && <p className="field-error" role="alert">{error}</p>}{message && <p className="save-message" role="status">{message}</p>}
        <p className="decimal-help">Guardá tus cambios antes de cambiar de sección.</p>
      </form>
      <aside className="result-column" aria-label="Recetas guardadas y subtotal">
        <form className="catalog-card" onSubmit={handleSettingsSubmit(updateHourlyRate)} noValidate><div className="card-heading"><h2>Valor de tu hora</h2></div><p className="section-help">Configuración general para todas las recetas.</p><label className="field">Tarifa por hora (ARS)<input {...registerSettings('hourlyRate', { validate: (value) => validateDecimalField(value, 'el valor de la hora', true) })} inputMode="decimal" placeholder="Por ejemplo, 5000" aria-invalid={Boolean(settingsErrors.hourlyRate)} aria-describedby="hourly-rate-error" /><FieldError id="hourly-rate-error" message={settingsErrors.hourlyRate?.message} /></label><button type="submit" className="secondary-button save-button" disabled={busy || loading}>Guardar tarifa</button></form>
        <form className="catalog-card" onSubmit={energyForm.handleSubmit(updateEnergySettings)} noValidate><fieldset className="form-controls" disabled={busy || loading}><div className="card-heading"><h2>Promedios diarios de energía</h2></div><p className="section-help">Estimación sencilla y actualizable con cada factura.</p><label className="field">Gas por día (ARS)<input {...energyForm.register('gasDailyAverage', { validate: (value) => validateDecimalField(value, 'el promedio diario de gas', true) })} inputMode="decimal" placeholder="3000" aria-invalid={Boolean(energyForm.formState.errors.gasDailyAverage)} /><FieldError id="gas-daily-error" message={energyForm.formState.errors.gasDailyAverage?.message} /></label><label className="field price-field">Electricidad por día (ARS)<input {...energyForm.register('electricityDailyAverage', { validate: (value) => validateDecimalField(value, 'el promedio diario de electricidad', true) })} inputMode="decimal" placeholder="2850" aria-invalid={Boolean(energyForm.formState.errors.electricityDailyAverage)} /><FieldError id="electricity-daily-error" message={energyForm.formState.errors.electricityDailyAverage?.message} /></label><button type="submit" className="secondary-button save-button">Guardar promedios</button></fieldset></form>
        <section className="catalog-card"><div className="card-heading"><h2>Recetas guardadas</h2><button type="button" className="text-button" disabled={busy || loading} onClick={() => void refreshData()}>Actualizar listas</button></div><label className="field">Cargar una receta<select value={selectedId} onChange={loadRecipe} disabled={busy || loading}><option value="">Nueva receta</option>{recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}</select></label>{selectedId && <p className="section-help catalog-help">Estás editando esta receta. Modificá sus datos y elegí «Guardar cambios».</p>}{loading && <p role="status">Cargando datos…</p>}{!loading && !recipes.length && <p className="section-help catalog-help">Todavía no hay recetas guardadas.</p>}{!loading && !supplies.length && <p className="section-help catalog-help">Primero guardá tus compras en Insumos.</p>}</section>
        <section className="result-card" aria-live="polite"><p className="eyebrow">COSTOS CONTEMPLADOS</p>{result ? <><h2 className="result-amount">{pesos.format(result.productionSubtotal)}</h2><dl className="result-breakdown"><div><dt>Ingredientes</dt><dd>{pesos.format(result.ingredientsSubtotal)}</dd></div><div><dt>Mano de obra</dt><dd>{result.laborCost === null ? 'Pendiente' : pesos.format(result.laborCost)}</dd></div><div><dt>Horno a gas</dt><dd>{result.gasCost === null ? 'Pendiente' : pesos.format(result.gasCost)}</dd></div><div><dt>Batidora eléctrica</dt><dd>{result.electricityCost === null ? 'Pendiente' : pesos.format(result.electricityCost)}</dd></div>{result.items.map((item, index) => <div className="ingredient-detail" key={index}><dt>{item.name}<br /><small>{decimal.format(item.quantity)} {item.unit === 'unit' ? 'unidades' : item.unit}</small></dt><dd>{pesos.format(item.cost)}</dd></div>)}</dl>{result.missingInputs.length > 0 && <p className="pending-cost" role="status">Falta completar: {result.missingInputs.join(' y ')}. El importe mostrado es parcial.</p>}<p className="result-footnote">Precios, tarifa y promedios diarios consultados al calcular.</p></> : <><h2 className="result-placeholder">Tu receta, ingrediente a ingrediente.</h2><p className="result-description">Completá el formulario para ver el desglose.</p></>}</section>
        <section className="scope-note"><h2>Costo de producción contemplado</h2><p>Incluye ingredientes, mano de obra y el prorrateo simple de energía cuando están configurados. Los envases se suman al cotizar la venta.</p></section>
      </aside>
    </div>
  </main>;
}
