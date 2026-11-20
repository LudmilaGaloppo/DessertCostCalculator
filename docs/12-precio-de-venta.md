# Precio sugerido y precio manual

En **Packaging**, después de calcular una cotización, aparece la simulación de precio de venta. Tanto el costo como el precio corresponden a toda la cantidad elegida, con sus envases y stickers.

## Decisiones acordadas

- Ingresar un porcentaje para obtener un precio sugerido.
- Escribir un precio manual y ver cuánto queda, incluida una posible pérdida.
- No redondear automáticamente a múltiplos de $100, $500 u otros valores. La decisión de redondear queda a cargo de Ludmila.
- Calcular venta directa, sin comisiones de intermediarios.
- Mantener la simulación en pantalla; guardar presupuestos sigue pendiente.

No se fija un porcentaje predeterminado. El formulario empieza con el porcentaje vacío y permite elegir su base: recargo sobre costo o margen sobre venta.

## Recargo y margen

Un porcentaje necesita una base. Con costo de $10.000:

| Opción | Fórmula | Precio al 50% | Ganancia estimada |
|---|---|---:|---:|
| Recargo sobre costo | costo × (1 + porcentaje / 100) | $15.000 | $5.000 |
| Margen sobre venta | costo ÷ (1 − porcentaje / 100) | $20.000 | $10.000 |

El recargo puede superar el 100%. El margen usado para sugerir un precio debe ser menor al 100%, porque al llegar a ese valor la fórmula divide por cero. Ambos admiten 0%.

```text
Ganancia estimada = precio de venta − costo cotizado
Recargo sobre costo (%) = ganancia ÷ costo × 100
Margen sobre venta (%) = ganancia ÷ precio de venta × 100
```

La ganancia se calcula después de los costos contemplados, incluida la mano de obra configurada. No representa un cálculo contable de impuestos u otros gastos que todavía no estén modelados.

## Recorrido en pantalla

1. Elegir receta, presentación y cantidad en Packaging, y pulsar **Calcular costo**.
2. Elegir la base, ingresar el porcentaje y pulsar **Sugerir precio**.
3. Si se quiere otro importe, escribirlo en **Precio manual por toda la cotización** y pulsar **Calcular ganancia**.

Los dos resultados son independientes: editar el porcentaje retira su sugerencia; editar el precio manual retira su ganancia anterior. Cambiar receta, presentación o cantidad retira el costo y ambas simulaciones, hasta volver a calcular. Los campos aceptan coma o punto decimal, sin separadores de miles.

La aplicación conserva la precisión del cálculo y muestra moneda con dos decimales. No ajusta el precio sugerido a múltiplos. Para evaluar un precio redondeado a criterio propio, se lo ingresa en el campo manual.

Si el precio manual es menor al costo, aparece una pérdida con signo negativo. Cuando el costo es cero, el recargo no está definido; cuando el precio es cero, el margen no está definido. La aplicación lo informa en vez de mostrar infinito o inventar un porcentaje.

Si faltan datos de costos, los resultados se identifican como provisorios y se indican las entradas pendientes. El porcentaje se aplica al costo conocido, que todavía es parcial.

## Cómo está implementado

- `frontend/src/domain/costs.ts`: `calculateSuggestedSalePrice` recibe costo, porcentaje y base; `calculateSaleProfit` recibe costo y precio, y devuelve la diferencia y ambos porcentajes. Son funciones independientes de React y no modifican los datos de entrada.
- `shared/src/costs.d.ts`: `PricingBasis` limita las bases a `markup` y `margin`; `SaleProfit` describe el resultado. Un porcentaje `null` expresa que su denominador es cero.
- `frontend/src/components/SalePriceCalculator.tsx`: administra dos formularios con React Hook Form, valida sus campos y presenta los resultados. `PackagingCalculator.tsx` le entrega el costo de la cotización vigente.
- `frontend/tests/sale-price.test.ts`: verifica recargo frente a margen, precisión, precio manual, pérdidas, ceros, entradas inválidas y desbordamientos.

La implementación no se registra por sí sola como comprensión comprobada. El siguiente paso de aprendizaje puede ser recorrer cómo el formulario convierte el texto ingresado, llama a la función de dominio y muestra el resultado.

## Verificación

`npm run typecheck`, `npm test` (35 pruebas entre frontend y backend) y `npm run build` completados correctamente. En Chromium se comprobó el recorrido con respuestas de API simuladas: recargo, margen, rechazo de margen del 100%, precio manual con ganancia o pérdida, coma decimal, limpieza de resultados al editar y advertencia de costo parcial. Se revisaron capturas de escritorio y móvil de 390 px, sin desbordamiento horizontal ni errores de ejecución en el navegador. Esta prueba de pantalla no modificó MongoDB.
