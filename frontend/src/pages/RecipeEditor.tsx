import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import type { Recipe, RecipeIngredientsCost, Supply } from '@dessert-cost/shared';
import type { RecipeFormValues } from '../types/recipe-form';
import { emptyRecipeForm, recipeInputFromForm, recipeToForm } from '../utils/recipe-form';
import { validateDecimalField } from '../utils/ingredient-form';
import { calculateRecipeIngredients } from '../domain/costs';
import { listSupplies } from '../services/supplies';
import { listRecipes, saveRecipe } from '../services/recipes';

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
  // useFieldArray mantiene un ID estable por fila aunque se agreguen o quiten ingredientes.
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<RecipeIngredientsCost | null>(null);
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
      const [currentSupplies, currentRecipes] = await Promise.all([listSupplies(signal), listRecipes(signal)]);
      if (signal?.aborted) return;
      setSupplies(currentSupplies); setRecipes(currentRecipes);
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

  /** Valida, calcula y opcionalmente persiste la receta. */
  async function processRecipe(values: RecipeFormValues, persist: boolean) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); clearResult(); clearErrors();
    try {
      const currentSupplies = await listSupplies();
      setSupplies(currentSupplies);
      const input = recipeInputFromForm(values, currentSupplies);
      const calculated = calculateRecipeIngredients(input, currentSupplies);
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
          <fieldset><legend>Ingredientes</legend><p className="section-help">Elegí insumos guardados. Por ejemplo, usá 375 g de una harina comprada en kg.</p>
            {fields.map((field, index) => <fieldset className="ingredient-row" key={field.id}><legend>Ingrediente {index + 1}</legend>
              <label className="field">Insumo<select {...register(`ingredients.${index}.supplyId`, { required: 'Elegí un insumo.' })} aria-invalid={Boolean(errors.ingredients?.[index]?.supplyId)} aria-describedby={`supply-error-${index}`}><option value="">Seleccionar insumo</option>{supplies.map((supply) => <option key={supply.id} value={supply.id}>{supply.name} · compra en {supply.purchaseUnit}</option>)}</select><FieldError id={`supply-error-${index}`} message={errors.ingredients?.[index]?.supplyId?.message} /></label>
              <div className="field-row price-field"><label className="field">Cantidad utilizada<input {...register(`ingredients.${index}.quantity`, { validate: (value) => validateDecimalField(value, 'la cantidad utilizada', true) })} inputMode="decimal" aria-invalid={Boolean(errors.ingredients?.[index]?.quantity)} aria-describedby={`quantity-error-${index}`} /><FieldError id={`quantity-error-${index}`} message={errors.ingredients?.[index]?.quantity?.message} /></label><label className="field">Unidad de uso<select {...register(`ingredients.${index}.unit`)}><UnitOptions /></select></label></div>
              <button type="button" className="text-button" onClick={() => removeIngredient(index)} disabled={fields.length === 1}>Quitar ingrediente</button>
            </fieldset>)}
            <button type="button" className="secondary-button" onClick={addIngredient} disabled={fields.length >= 100}>Agregar ingrediente</button>
          </fieldset>
          <p className="decimal-help">Podés usar coma o punto decimal, sin separador de miles.</p>
          <div className="form-actions"><button type="submit" className="secondary-button">Calcular subtotal</button><button type="button" className="primary-button" onClick={handleSubmit(save)}>{selectedId ? 'Actualizar receta' : 'Guardar receta'}</button></div>
        </fieldset>
        {busy && <p role="status">Procesando receta…</p>}{error && <p className="field-error" role="alert">{error}</p>}{message && <p className="save-message" role="status">{message}</p>}
        <p className="decimal-help">Guardá tus cambios antes de cambiar de sección.</p>
      </form>
      <aside className="result-column" aria-label="Recetas guardadas y subtotal">
        <section className="catalog-card"><div className="card-heading"><h2>Recetas guardadas</h2><button type="button" className="text-button" disabled={busy || loading} onClick={() => void refreshData()}>Actualizar listas</button></div><label className="field">Cargar una receta<select value={selectedId} onChange={loadRecipe} disabled={busy || loading}><option value="">Nueva receta</option>{recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}</select></label>{loading && <p role="status">Cargando datos…</p>}{!loading && !recipes.length && <p className="section-help catalog-help">Todavía no hay recetas guardadas.</p>}{!loading && !supplies.length && <p className="section-help catalog-help">Primero guardá tus compras en Insumos.</p>}</section>
        <section className="result-card" aria-live="polite"><p className="eyebrow">SUBTOTAL DE INGREDIENTES</p>{result ? <><h2 className="result-amount">{pesos.format(result.ingredientsSubtotal)}</h2><dl className="result-breakdown">{result.items.map((item, index) => <div key={index}><dt>{item.name}<br /><small>{decimal.format(item.quantity)} {item.unit === 'unit' ? 'unidades' : item.unit}</small></dt><dd>{pesos.format(item.cost)}</dd></div>)}</dl><p className="result-footnote">Precios consultados al realizar este cálculo.</p></> : <><h2 className="result-placeholder">Tu receta, ingrediente a ingrediente.</h2><p className="result-description">Completá el formulario para ver el desglose.</p></>}</section>
        <section className="scope-note"><h2>Solo ingredientes</h2><p>Este subtotal todavía no incluye mano de obra, energía ni envases. No es el precio de venta.</p></section>
      </aside>
    </div>
  </main>;
}
