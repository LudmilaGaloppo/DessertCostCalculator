import { useState, type ChangeEvent, type FormEvent } from 'react';
import { calculateIngredientForm, emptyIngredientForm, exampleIngredientForm } from '../utils/ingredient-form';
import type { IngredientFormResult } from '../types/ingredient-form';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 6 });

/** Renderiza las unidades disponibles en los selectores de compra y uso. */
function UnitOptions() {
  return <><option value="g">Gramos (g)</option><option value="kg">Kilogramos (kg)</option><option value="ml">Mililitros (ml)</option><option value="l">Litros (l)</option><option value="unit">Unidades</option></>;
}

/** Administra los campos, envía el cálculo y presenta su resultado o un mensaje de error. */
export default function IngredientCalculator() {
  // useState conserva los valores de la pantalla y provoca su actualización al modificarlos.
  const [values, setValues] = useState({ ...emptyIngredientForm });
  const [result, setResult] = useState<IngredientFormResult | null>(null);
  const [error, setError] = useState('');

  /** Actualiza el campo editado y retira el resultado anterior para no mostrar un importe desactualizado. */
  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.currentTarget;
    setValues({ ...values, [name]: value });
    setResult(null);
    setError('');
  }

  /** Evita la recarga del formulario y muestra el cálculo o el error que devuelve la validación. */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setResult(calculateIngredientForm(values));
      setError('');
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : 'No pudimos calcular el costo. Revisá los datos.');
    }
  }

  /** Carga el ejemplo conocido de harina y muestra su costo de $900 para explorar el formulario. */
  function handleExample() {
    setValues({ ...exampleIngredientForm });
    setResult(calculateIngredientForm(exampleIngredientForm));
    setError('');
  }

  /** Vacía los campos y limpia los mensajes para comenzar otro cálculo. */
  function handleReset() {
    setValues({ ...emptyIngredientForm });
    setResult(null);
    setError('');
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
          <form className="form-card" onSubmit={handleSubmit} noValidate aria-label="Calcular costo de un ingrediente">
            <div className="card-heading"><h2>Datos del ingrediente</h2><button type="button" className="text-button" onClick={handleExample}>Cargar ejemplo</button></div>
            <label className="field" htmlFor="name">Nombre del insumo
              <input id="name" name="name" value={values.name} onChange={handleChange} placeholder="Por ejemplo, harina 0000" autoComplete="off" required />
            </label>
            <fieldset>
              <legend>Tu compra</legend>
              <p className="section-help">La cantidad y el precio total de lo que compraste.</p>
              <div className="field-row">
                <label className="field" htmlFor="purchaseQuantity">Cantidad comprada
                  <input id="purchaseQuantity" name="purchaseQuantity" inputMode="decimal" value={values.purchaseQuantity} onChange={handleChange} placeholder="2,5" aria-describedby="decimal-help" required />
                </label>
                <label className="field" htmlFor="purchaseUnit">Unidad de compra
                  <select id="purchaseUnit" name="purchaseUnit" value={values.purchaseUnit} onChange={handleChange}><UnitOptions /></select>
                </label>
              </div>
              <label className="field price-field" htmlFor="purchasePrice">Precio total de compra (ARS)
                <input id="purchasePrice" name="purchasePrice" inputMode="decimal" value={values.purchasePrice} onChange={handleChange} placeholder="6000" aria-describedby="decimal-help" required />
              </label>
            </fieldset>
            <fieldset>
              <legend>En tu receta</legend>
              <p className="section-help">La cantidad que vas a utilizar de ese insumo.</p>
              <div className="field-row">
                <label className="field" htmlFor="usedQuantity">Cantidad utilizada
                  <input id="usedQuantity" name="usedQuantity" inputMode="decimal" value={values.usedQuantity} onChange={handleChange} placeholder="375" aria-describedby="decimal-help" required />
                </label>
                <label className="field" htmlFor="usedUnit">Unidad de uso
                  <select id="usedUnit" name="usedUnit" value={values.usedUnit} onChange={handleChange}><UnitOptions /></select>
                </label>
              </div>
            </fieldset>
            <p className="decimal-help" id="decimal-help">Podés usar coma o punto decimal, sin separador de miles.</p>
            {error && <div className="error-message" role="alert"><strong>Revisá los datos</strong><span>{error}</span></div>}
            <div className="form-actions"><button type="submit" className="primary-button">Calcular costo</button><button type="button" className="secondary-button" onClick={handleReset}>Limpiar</button></div>
          </form>
          <aside className="result-column" aria-label="Resultado del cálculo">
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
            <p className="session-note">Los datos de esta pantalla se mantienen mientras la página esté abierta. No se guardan al recargar.</p>
          </aside>
        </div>
        <footer className="page-footer">Hecho para entender tus costos, receta a receta.</footer>
      </main>
    </>
  );
}
