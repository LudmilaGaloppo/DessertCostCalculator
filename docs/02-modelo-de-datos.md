# Revisión del primer modelo de datos

Estado: propuesta de Ludmila revisada el 10/11/2026. Pendiente aplicar los ajustes y comprobar cómo distingue los datos ingresados de los resultados calculados. Las propuestas originales se conservan en [el primer documento](01-insumos-y-costo-proporcional.md#mi-propuesta-de-modelo-de-datos-para-un-insumo).

Esta devolución orienta el siguiente intento. Los nombres y la estructura técnica definitiva siguen abiertos.

## Lo que ya representa tu propuesta

- El insumo tiene nombre, identificador, cantidad comprada, unidad y precio total de compra. Es una base suficiente para calcular costos proporcionales.
- La receta reúne sus ingredientes en un array de objetos; cada objeto referencia un insumo mediante su identificador y agrega la cantidad utilizada. Esa relación permite reutilizar el catálogo.
- Reconocés la necesidad de contemplar trabajo, gas, rendimiento y envases.
- Proponés generar el precio de venta al calcularlo, sin tener que escribirlo manualmente ni guardarlo como un valor fijo en la receta.

## 1. Datos del insumo

Tu modelo sirve como ficha con una cantidad y un precio de compra de referencia. La fecha que mencionaste en el ejercicio anterior puede agregarse si queremos indicar cuándo se registró ese precio. Conservar varias compras y sus precios será otra decisión de almacenamiento.

Para expresar con precisión lo que significa cada campo, estos son nombres posibles:

| Tu nombre | Nombre posible | Significado |
|---|---|---|
| `InputName` | `name` | Nombre del insumo; también puede contener marca o presentación |
| `UnitOfMeasurement` | `purchaseUnit` | Unidad en la que está expresada la cantidad comprada |
| `Amount` | `purchaseQuantity` | Cantidad comprada correspondiente al precio registrado |
| `Price` | `purchasePrice` | Precio total pagado por esa cantidad |
| `Id` | `id` | Identificador único del insumo dentro del catálogo |

`Input` suele nombrar una entrada o un campo de formulario. `Supply` o `ingredient` son alternativas para nombrar el concepto de insumo/ingrediente. Podemos utilizar simplemente `name` dentro del objeto: el contexto ya indica de qué nombre se trata.

En JavaScript es habitual escribir propiedades con inicial minúscula: `purchasePrice`. Esto es una convención que elegiremos al pasar a código, no un error de tu razonamiento.

Separar el valor numérico de su presentación: cantidad `500` y unidad `g`; precio numérico `2000` y formato visual `$2.000`. El tratamiento técnico de decimales se definirá al implementar los cálculos.

## 2. Ingredientes dentro de una receta

Al identificador y la cantidad que propusiste les falta una unidad de uso, o una regla explícita que determine esa unidad. Si comprás harina en kg y la utilizás en g, el programa necesita saber ambas unidades para convertirlas.

Para la propuesta actual, cada ingrediente de receta puede expresar:

- Referencia al insumo: por ejemplo, el identificador de la harina.
- Cantidad usada: por ejemplo, `375`.
- Unidad usada: por ejemplo, `g`.
- Un nombre visible opcional, si querés mostrar «Harina» en lugar del nombre completo del catálogo.

La idea de abreviar el nombre que propusiste tiene sentido. Podemos obtener el nombre del catálogo y permitir un alias cuando haga falta. El identificador mantiene la relación aunque cambie el texto visible.

Usaremos valores definidos para las unidades, como `g`, `kg`, `ml`, `l` y `unit`, en lugar de aceptar cualquier texto. Kg y g son compatibles; convertir g a ml requiere información adicional del ingrediente. Una porción depende del rendimiento de la receta, no tiene un peso universal.

La receta también necesitará su propio identificador para poder editarla y referenciarla.

## 3. Subtotal de ingredientes y costo de producción

En la descripción de `ProductionCost` escribiste que sumarías todos los `Price` de los insumos. Esos precios representan las compras completas. En la receta debemos sumar el costo proporcional de lo utilizado.

Ejemplo ya resuelto: comprar 2,5 kg de harina por $6.000 y utilizar 375 g aporta $900 al costo de la receta.

```text
Costo de cada ingrediente = precio de compra × cantidad utilizada ÷ cantidad comprada
                            (con ambas cantidades en la misma unidad)

Subtotal de ingredientes = suma de los costos de las cantidades utilizadas
Costo de producción de la tanda = subtotal de ingredientes + trabajo + energía
                                 + otros costos de producción contemplados
```

Los envases y otros gastos se asignan a la tanda o a la presentación de venta según corresponda, evitando duplicarlos. Tenemos que dejar explícito qué incluye cada total.

El subtotal y el costo de producción pueden calcularse a partir de otros datos, igual que el precio de venta. En el modelo inicial podemos tratarlos como resultados, sin pedir que la persona los cargue. Un presupuesto histórico que deba conservar sus importes requeriría una decisión adicional; eso sigue pendiente.

## 4. Rendimiento y presentación de venta

Los campos originales `QuantityAvailableForSale` y `UnitOfSale` se reemplazaron, por acuerdo con Ludmila, por `YieldQuantity` y `YieldUnit`: cantidad de producto vendible que rinde una tanda y unidad de esa cantidad. Por ejemplo, `YieldQuantity: 600` y `YieldUnit: "g"`. La presentación de venta se define por separado.

### Presentaciones de cookies acordadas — 18/11/2026

Ludmila indicó dos formas de venta actuales: por unidad y en cajas con varias unidades. Cada cookie pesa 120 g. Los ejemplos anteriores de presentaciones de 100 g y 250 g eran hipotéticos; para estas cookies trabajaremos con cantidades de unidades.

| Dato | Cantidad | Unidad |
|---|---:|---|
| Peso de una cookie | 120 | g |
| Presentación individual | 1 | unit |
| Presentación en caja | Cantidad de cookies elegida por el cliente al cotizar | unit |

Para esta receta conviene expresar el rendimiento como cantidad de cookies vendibles por tanda: `YieldQuantity` guarda esa cantidad y `YieldUnit` vale `"unit"`. Todavía no se informó cuántas cookies rinde una tanda. Los 120 g describen el peso de una cookie, no el rendimiento total.

`Presentations` puede reunir las opciones de venta en un array de objetos. La opción individual representa una cookie; la opción en caja admite una cantidad variable de cookies, expresada en `"unit"`. La cantidad elegida para la caja se indica al cotizar cada pedido, sin modificar la receta ni crear una presentación por cada cantidad posible. El peso del contenido se calcula como `120 × cantidad de cookies`, en gramos; no es necesario cargarlo nuevamente para cada presentación. Este peso no incluye el envase.

Ludmila confirmó que el cliente podrá elegir cuántas cookies llevar. Por ejemplo, una cotización de 5 cookies en caja tiene una cantidad ingresada de 5 unidades y un peso calculado de 600 g. Esto describe una entrada para calcular el costo; todavía no implica implementar un sistema para guardar pedidos.

Queda pendiente definir los tamaños, capacidades y costos de los envases, cómo elegir uno o varios según la cantidad solicitada y si la venta individual lleva envoltorio. El costo de packaging debe contemplar todos los envases necesarios para esa cotización.

El rendimiento distribuye el costo de la tanda. La presentación determina cuántas cookies cotizamos y qué envase necesitan. Si el costo de la tanda excluye los envases de venta:

```text
Costo de una cookie = costo de producción de la tanda ÷ cookies vendibles de la tanda
Costo de una caja armada = costo de una cookie × cookies incluidas + costo del packaging de esa caja
```

Estos resultados son costos; el precio de venta se definirá después.

«Cantidad disponible» también puede confundirse con stock: una receta puede rendir 600 g aunque hoy todavía no hayas elaborado ninguna tanda. Para este dato, un nombre que exprese rendimiento ayuda a evitar esa confusión.

Para vender por piezas o porciones necesitamos conocer cuántas produce la tanda. La conversión entre gramos y porciones requiere esa información.

El objeto de packaging describe el envase y su costo. Para la opción en caja, la cantidad de cookies vendidas pertenece a la cotización concreta: la capacidad del envase y su contenido elegido pueden diferir.

## 5. Trabajo, gas y ganancia: datos diferentes

La duda que dejaste sobre calcular trabajo y gas mediante un porcentaje de ganancia necesita una corrección: primero debemos estimar cuánto cuestan; después podemos aplicar el porcentaje elegido al costo contemplado.

Para el trabajo, una forma de estimarlo es tiempo atribuido a la receta × valor de la hora. La calculadora de [Craftybase](https://craftybase.com/cake-pricing-calculator) distingue horas, tarifa por hora y margen. Tomamos esa separación conceptual; sus importes orientativos en dólares no determinan tu tarifa.

Para el gas, las horas por sí solas no indican pesos. La [tabla de consumos de artefactos](https://m.enargas.gov.ar/secciones/eficiencia-energetica/consumo-artefactos.php) distingue horno y quemadores por su consumo por hora. El [estimador de consumo](https://www.enargas.gob.ar/secciones/eficiencia-energetica/estimador-factura/estimador-consumo.php) también considera artefacto y horas de uso.

Una propuesta sencilla para nuestra app es configurar un costo estimado por hora para cada artefacto utilizado, y multiplicarlo por su tiempo. Si se utiliza gas de red, esa estimación puede apoyarse en consumo por hora × costo por m³ aplicable, dejando explícitos los supuestos. Los cargos generales se distribuirían por separado para evitar duplicarlos. Gas envasado requiere otra referencia de consumo y precio. Todavía no se eligió un método ni una tarifa para tu caso.

```text
Costo de trabajo = horas de trabajo × valor configurado de la hora
Costo estimado de gas = suma del tiempo de cada artefacto × su costo estimado por hora
```

El tiempo de horno y el de trabajo pueden superponerse. Las horas de trabajo deben expresar el trabajo que atribuimos a la receta, con una regla que definiremos.

Aunque los importes resultantes se calculen al momento, necesitamos conservar las entradas que permiten calcularlos: tiempos y tarifas o estimaciones. El porcentaje de ganancia será otra entrada, con su base explícita (recargo sobre costo o margen sobre venta).

## Continuación: del modelo al código

Se revisaron la unidad de uso de `Ingredients`, el costo proporcional y la separación entre rendimiento y presentación. En el ejemplo de cookies, Ludmila calculó correctamente $500 por cookie, $2.700 por cinco cookies con su caja y 600 g de contenido. Se aclaró que costo de producción y precio de venta son resultados diferentes.

Para el trabajo, la propuesta es guardar `WorkingHours` en cada receta y `HourlyRate` en la configuración general. `LaborCost` se calcula a partir de ambos. Al actualizar la tarifa, las próximas consultas pueden recalcular los costos; conservar un presupuesto histórico requerirá guardar los valores utilizados en él. La tarifa y la regla para atribuir tiempos siguen pendientes.

El costo proporcional ya está [implementado en TypeScript](04-calculo-de-receta.md), con validaciones, conversiones y subtotal de ingredientes. El método de estimación de gas y los detalles de packaging se trabajarán al incorporar esos gastos.
