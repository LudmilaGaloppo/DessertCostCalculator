import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { calculateIngredientForm, emptyIngredientForm, exampleIngredientForm, supplyInputFromForm, validateDecimalField } from '../utils/ingredient-form';
import { listSupplies, saveSupply } from '../services/supplies';
import type { IngredientFormValues, IngredientFormResult } from '../types/ingredient-form';
import type { Supply } from '@dessert-cost/shared';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 6 });

/** Renderiza las unidades disponibles en los selectores de compra y uso. */
function UnitOptions() {
  return <><option value="g">Gramos (g)</option><option value="kg">Kilogramos (kg)</option><option value="ml">Mililitros (ml)</option><option value="l">Litros (l)</option><option value="unit">Unidades</option></>;
}

/** Presenta el mensaje de validación junto al campo al que pertenece. */
function FieldMessage({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="field-error" role="alert">{message}</span> : null;
}

/** Administra los campos, envía el cálculo y presenta su resultado o un mensaje de error. */
export default function IngredientCalculator() {
  // register conecta los inputs; handleSubmit valida; reset carga o limpia el formulario.
  const { register, handleSubmit, reset, getValues, trigger, setError, clearErrors, formState: { errors } } = useForm<IngredientFormValues>({ defaultValues: emptyIngredientForm });
  const [result, setResult] = useState<IngredientFormResult | null>(null);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  // useRef bloquea un segundo guardado inmediatamente, incluso antes del próximo render.
  const savingRequest = useRef(false);

  // La carga inicial se cancela al desmontar la pantalla para evitar respuestas tardías.
  useEffect(function loadInitialCatalog() {
    const controller = new AbortController();
    void refreshCatalog(controller.signal);
    /** Cancela la petición pendiente cuando React desmonta la pantalla. */
    return function cancelCatalogLoad() { controller.abort(); };
  }, []);

  /** Lee nuevamente los insumos guardados y muestra un error recuperable si la API no responde. */
  async function refreshCatalog(signal?: AbortSignal) {
    setIsLoading(true);
    setCatalogError('');
    try {
      const data = await listSupplies(signal);
      if (!signal?.aborted) setSupplies(data);
    } catch (error) {
      if (!signal?.aborted) setCatalogError(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }

  /** Reintenta la lectura del catálogo desde el botón de actualización. */
  function handleRefresh() { void refreshCatalog(); }

  /** Retira el resultado y los mensajes anteriores al editar un campo. */
  function clearCalculation() {
    setResult(null);
    clearErrors('root');
    setSaveMessage('');
  }

  /** Calcula con los valores que validó React Hook Form y muestra errores de unidades incompatibles. */
  function onCalculate(values: IngredientFormValues) {
    try {
      setResult(calculateIngredientForm(values));
      clearErrors('root');
    } catch (cause) {
      setResult(null);
      setError('root.calculation', { message: cause instanceof Error ? cause.message : 'No pudimos calcular el costo. Revisá los datos.' });
    }
  }

  /** Guarda o actualiza únicamente el insumo; la cantidad usada pertenece al cálculo, no al catálogo. */
  async function handleSaveSupply() {
    if (savingRequest.current) return;
    savingRequest.current = true;
    setSaveMessage('');
    setCatalogError('');
    try {
      if (!await trigger(['name', 'purchaseQuantity', 'purchasePrice', 'purchaseUnit'], { shouldFocus: true })) return;
      setIsSaving(true);
      const saved = await saveSupply(supplyInputFromForm(getValues()), selectedSupplyId || undefined);
      setSupplies((current) => [...current.filter((supply) => supply.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedSupplyId(saved.id);
      setSaveMessage('Insumo guardado. Podés recuperarlo después de recargar la página.');
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'No se pudo guardar el insumo.');
    } finally { savingRequest.current = false; setIsSaving(false); }
  }

  /** Carga la compra elegida desde MongoDB y conserva la cantidad de uso que se estaba editando. */
  function handleLoadSupply(event: ChangeEvent<HTMLSelectElement>) {
    const supply = supplies.find((item) => item.id === event.currentTarget.value);
    if (!supply) { handleReset(); return; }
    reset({ ...getValues(), name: supply.name, purchaseQuantity: String(supply.purchaseQuantity), purchasePrice: String(supply.purchasePrice), purchaseUnit: supply.purchaseUnit });
    setSelectedSupplyId(supply.id);
    clearCalculation();
  }

  /** Carga el ejemplo conocido de harina y muestra su costo de $900 para explorar el formulario. */
  function handleExample() {
    reset(exampleIngredientForm);
    setSelectedSupplyId('');
    setResult(calculateIngredientForm(exampleIngredientForm));
    setSaveMessage('');
  }

  /** Vacía los campos y limpia los mensajes para comenzar otro cálculo. */
  function handleReset() {
    reset(emptyIngredientForm);
    setSelectedSupplyId('');
    setResult(null);
    setSaveMessage('');
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#main"><span className="brand-mark" aria-hidden="true">dc</span><span>Desserts Cost</span></a>
        <span className="topbar-label">Tu cocina, en números</span>
      </header>
      <main id="main">
        <div className="page-heading">
          <p className="eyebrow">CALCULADORA DE INSUMOS</p>
          <h1>Calculá lo que usás.</h1>
          <p>De la compra a tu receta: conocé el costo de cada cantidad.</p>
        </div>
        <div className="calculator-layout">
          <form className="form-card" onSubmit={handleSubmit(onCalculate)} onChange={clearCalculation} noValidate aria-label="Calcular costo de un ingrediente">
            <fieldset className="form-controls" disabled={isSaving}>
            <div className="card-heading"><h2>Datos del ingrediente</h2><button type="button" className="text-button" onClick={handleExample}>Cargar ejemplo</button></div>
            <label className="field" htmlFor="name">Nombre del insumo
              <input id="name" {...register('name', { required: 'Ingresá el nombre del insumo.', maxLength: { value: 120, message: 'Usá hasta 120 caracteres.' }, validate: (value) => Boolean(value.trim()) || 'Ingresá el nombre del insumo.' })} placeholder="Por ejemplo, harina 0000" autoComplete="off" aria-invalid={Boolean(errors.name)} aria-describedby="name-error" required />
              <FieldMessage id="name-error" message={errors.name?.message} />
            </label>
            <fieldset>
              <legend>Tu compra</legend>
              <p className="section-help">La cantidad y el precio total de lo que compraste.</p>
              <div className="field-row">
                <label className="field" htmlFor="purchaseQuantity">Cantidad comprada
                  <input id="purchaseQuantity" {...register('purchaseQuantity', { validate: (value) => validateDecimalField(value, 'la cantidad comprada', true) })} inputMode="decimal" placeholder="2,5" aria-invalid={Boolean(errors.purchaseQuantity)} aria-describedby="decimal-help purchase-quantity-error" required />
                  <FieldMessage id="purchase-quantity-error" message={errors.purchaseQuantity?.message} />
                </label>
                <label className="field" htmlFor="purchaseUnit">Unidad de compra
                  <select id="purchaseUnit" {...register('purchaseUnit', { required: true })}><UnitOptions /></select>
                </label>
              </div>
              <label className="field price-field" htmlFor="purchasePrice">Precio total de compra (ARS)
                <input id="purchasePrice" {...register('purchasePrice', { validate: (value) => validateDecimalField(value, 'el precio de compra') })} inputMode="decimal" placeholder="6000" aria-invalid={Boolean(errors.purchasePrice)} aria-describedby="decimal-help purchase-price-error" required />
                <FieldMessage id="purchase-price-error" message={errors.purchasePrice?.message} />
              </label>
              <button type="button" className="secondary-button save-button" onClick={handleSaveSupply} disabled={isLoading}>{isSaving ? 'Guardando…' : selectedSupplyId ? 'Actualizar insumo guardado' : 'Guardar insumo'}</button>
              {saveMessage && <p className="save-message" role="status">{saveMessage}</p>}
            </fieldset>
            <fieldset>
              <legend>En tu receta</legend>
              <p className="section-help">La cantidad que vas a utilizar de ese insumo.</p>
              <div className="field-row">
                <label className="field" htmlFor="usedQuantity">Cantidad utilizada
                  <input id="usedQuantity" {...register('usedQuantity', { validate: (value) => validateDecimalField(value, 'la cantidad utilizada') })} inputMode="decimal" placeholder="375" aria-invalid={Boolean(errors.usedQuantity)} aria-describedby="decimal-help used-quantity-error" required />
                  <FieldMessage id="used-quantity-error" message={errors.usedQuantity?.message} />
                </label>
                <label className="field" htmlFor="usedUnit">Unidad de uso
                  <select id="usedUnit" {...register('usedUnit', { required: true })}><UnitOptions /></select>
                </label>
              </div>
            </fieldset>
            <p className="decimal-help" id="decimal-help">Podés usar coma o punto decimal, sin separador de miles.</p>
            {errors.root?.calculation && <div className="error-message" role="alert"><strong>Revisá los datos</strong><span>{errors.root.calculation.message}</span></div>}
            <div className="form-actions"><button type="submit" className="primary-button">Calcular costo</button><button type="button" className="secondary-button" onClick={handleReset}>Limpiar</button></div>
            </fieldset>
          </form>
          <aside className="result-column" aria-label="Resultado del cálculo">
            <section className="catalog-card" aria-label="Catálogo de insumos">
              <div className="card-heading"><h2>Insumos guardados</h2><button type="button" className="text-button" onClick={handleRefresh} disabled={isLoading || isSaving}>Actualizar lista</button></div>
              <label className="field" htmlFor="savedSupply">Cargar un insumo
                <select id="savedSupply" value={selectedSupplyId} onChange={handleLoadSupply} disabled={isLoading || isSaving}><option value="">Nuevo insumo</option>{supplies.map((supply) => <option key={supply.id} value={supply.id}>{supply.name} · {decimal.format(supply.purchaseQuantity)} {supply.purchaseUnit}</option>)}</select>
              </label>
              {isLoading && <p role="status">Cargando catálogo…</p>}
              {!isLoading && !catalogError && supplies.length === 0 && <p className="section-help catalog-help">Todavía no hay insumos guardados.</p>}
              {catalogError && <p className="field-error" role="alert">{catalogError}</p>}
            </section>
            <section className={`result-card ${result ? 'has-result' : ''}`} aria-live="polite" aria-atomic="true">
              <p className="eyebrow">COSTO EN TU RECETA</p>
              {result ? <>
                <h2 className="result-amount">{pesos.format(result.cost)}</h2>
                <p className="result-description">{decimal.format(result.usedQuantity)} {result.usedUnit === 'unit' ? 'unidades' : result.usedUnit} de {result.name}</p>
                <dl className="result-breakdown"><div><dt>Compra de referencia</dt><dd>{decimal.format(result.purchaseQuantity)} {result.purchaseUnit === 'unit' ? 'unidades' : result.purchaseUnit}</dd></div><div><dt>Precio de esa compra</dt><dd>{pesos.format(result.purchasePrice)}</dd></div></dl>
                <p className="result-footnote">Importe proporcional a la cantidad utilizada.</p>
              </> : <>
                <h2 className="result-placeholder">Tu próximo cálculo,<br />más claro.</h2>
                <p className="result-description">Completá los datos y seleccioná «Calcular costo» para ver cuánto aporta este ingrediente.</p>
                <div className="empty-result-rule" aria-hidden="true" />
                <p className="result-footnote">También podés empezar con el ejemplo de harina.</p>
              </>}
            </section>
            <section className="scope-note"><h2>Un ingrediente a la vez</h2><p>Este importe incluye solo el insumo utilizado. El trabajo, la energía y los envases se suman al calcular la producción.</p></section>
            <p className="session-note">«Guardar insumo» conserva la compra en tu catálogo. La cantidad utilizada y el resultado de este cálculo no se guardan.</p>
          </aside>
        </div>
        <footer className="page-footer">Hecho para entender tus costos, receta a receta.</footer>
      </main>
    </>
  );
}
