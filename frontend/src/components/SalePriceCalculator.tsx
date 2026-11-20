import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { PricingBasis, SaleProfit, SaleQuoteCost } from '@dessert-cost/shared';
import { calculateSaleProfit, calculateSuggestedSalePrice } from '../domain/costs';
import { parseDecimal, validateDecimalField } from '../utils/ingredient-form';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

interface SuggestedPriceForm { percentage: string; basis: PricingBasis }
interface ManualPriceForm { salePrice: string }

/** Muestra la diferencia y sus dos porcentajes, también cuando hay pérdida o una base cero. */
function ProfitBreakdown({ result }: { result: SaleProfit }) {
  return <dl className="result-breakdown">
    <div><dt>{result.profit < 0 ? 'Pérdida estimada' : 'Ganancia estimada'}</dt><dd>{pesos.format(result.profit)}</dd></div>
    <div><dt>Recargo sobre costo</dt><dd>{result.markupPercentage === null ? 'No definido (costo cero)' : `${decimal.format(result.markupPercentage)}%`}</dd></div>
    <div><dt>Margen sobre venta</dt><dd>{result.marginPercentage === null ? 'No definido (precio cero)' : `${decimal.format(result.marginPercentage)}%`}</dd></div>
  </dl>;
}

/** Simula precios para la cotización actual con un porcentaje o con un precio manual independiente. */
export default function SalePriceCalculator({ cost }: { cost: SaleQuoteCost }) {
  const suggestedForm = useForm<SuggestedPriceForm>({ defaultValues: { percentage: '', basis: 'markup' } });
  const manualForm = useForm<ManualPriceForm>({ defaultValues: { salePrice: '' } });
  const [suggested, setSuggested] = useState<SaleProfit | null>(null);
  const [manual, setManual] = useState<SaleProfit | null>(null);

  /** Retira la sugerencia anterior cuando cambia el porcentaje o su base. */
  function clearSuggested() { setSuggested(null); suggestedForm.clearErrors(); }

  /** Retira el resultado manual anterior cuando se edita el precio de venta. */
  function clearManual() { setManual(null); manualForm.clearErrors(); }

  /** Valida el porcentaje y obtiene el precio sugerido con su ganancia estimada. */
  function suggestPrice(values: SuggestedPriceForm) {
    setSuggested(null);
    try {
      const percentage = parseDecimal(values.percentage, 'el porcentaje');
      const price = calculateSuggestedSalePrice(cost.quotedCost, percentage, values.basis);
      setSuggested(calculateSaleProfit(cost.quotedCost, price));
    } catch (cause) {
      suggestedForm.setError('percentage', { message: cause instanceof Error ? cause.message : 'No se pudo sugerir el precio.' });
    }
  }

  /** Calcula la diferencia al precio manual, sin modificar la sugerencia por porcentaje. */
  function evaluateManualPrice(values: ManualPriceForm) {
    setManual(null);
    try {
      setManual(calculateSaleProfit(cost.quotedCost, parseDecimal(values.salePrice, 'el precio de venta')));
    } catch (cause) {
      manualForm.setError('salePrice', { message: cause instanceof Error ? cause.message : 'No se pudo calcular la ganancia.' });
    }
  }

  return <section className="catalog-card sale-price-card" aria-labelledby="sale-price-heading">
    <div className="card-heading"><h2 id="sale-price-heading">Precio de venta</h2></div>
    <p className="section-help">Importes por toda la cotización ({cost.requestedUnits} cookies), con su packaging. Venta directa, sin comisiones.</p>
    {cost.isPartial && <p className="pending-cost" role="status">Falta completar: {cost.missingInputs.join(' y ')}. Los precios y las ganancias son provisorios porque el costo es parcial.</p>}
    <form onSubmit={suggestedForm.handleSubmit(suggestPrice)} onChange={clearSuggested} noValidate aria-label="Sugerir precio por porcentaje">
      <label className="field">Aplicar porcentaje sobre
        <select {...suggestedForm.register('basis')} aria-describedby="pricing-basis-help">
          <option value="markup">Costo (recargo)</option>
          <option value="margin">Precio de venta (margen)</option>
        </select>
      </label>
      <p id="pricing-basis-help" className="decimal-help">Con un costo de $10.000, un recargo del 50% sugiere $15.000; un margen del 50% sugiere $20.000.</p>
      <label className="field">Porcentaje (%)
        <input {...suggestedForm.register('percentage', { validate: (value) => validateDecimalField(value, 'el porcentaje') })} inputMode="decimal" placeholder="Por ejemplo, 50" aria-invalid={Boolean(suggestedForm.formState.errors.percentage)} aria-describedby="sale-percentage-error" />
      </label>
      {suggestedForm.formState.errors.percentage && <span id="sale-percentage-error" className="field-error" role="alert">{suggestedForm.formState.errors.percentage.message}</span>}
      <button type="submit" className="primary-button save-button">Sugerir precio</button>
      <div aria-live="polite">{suggested && <>
        <p className="decimal-help">Precio sugerido{cost.isPartial ? ' provisorio' : ''}</p>
        <p className="result-amount">{pesos.format(suggested.salePrice)}</p>
        <ProfitBreakdown result={suggested} />
      </>}</div>
    </form>
    <form className="nested-card" onSubmit={manualForm.handleSubmit(evaluateManualPrice)} onChange={clearManual} noValidate aria-label="Evaluar precio manual">
      <h3>Elegí tu precio</h3>
      <label className="field">Precio manual por toda la cotización (ARS)
        <input {...manualForm.register('salePrice', { validate: (value) => validateDecimalField(value, 'el precio de venta') })} inputMode="decimal" aria-invalid={Boolean(manualForm.formState.errors.salePrice)} aria-describedby="manual-sale-price-error" />
      </label>
      {manualForm.formState.errors.salePrice && <span id="manual-sale-price-error" className="field-error" role="alert">{manualForm.formState.errors.salePrice.message}</span>}
      <button type="submit" className="secondary-button save-button">Calcular ganancia</button>
      <div aria-live="polite">{manual && <ProfitBreakdown result={manual} />}</div>
    </form>
    <p className="result-footnote">La ganancia es lo que queda después de los costos contemplados, incluida la mano de obra configurada. No se redondea a múltiplos; los importes se muestran con dos decimales. Esta simulación no se guarda.</p>
  </section>;
}
