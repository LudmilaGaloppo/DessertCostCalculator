# Primera función: costo de un ingrediente

Estado: material introductorio opcional, conservado como referencia. La implementación actual está en [cálculo de ingredientes de una receta](04-calculo-de-receta.md), con validaciones, conversiones y pruebas ejecutables. No hace falta repasar esta introducción para continuar.

## Qué construimos primero

Una función que recibe los datos necesarios para calcular el costo de una cantidad utilizada y devuelve ese costo como número. Después podremos usarla desde una pantalla y repetirla para cada ingrediente de una receta.

JavaScript es el lenguaje con el que expresamos esta regla. Para estudiar esta función no necesitamos todavía React, que nos servirá para construir la interfaz, ni elegir el almacenamiento.

## La función

```js
function calculateIngredientCost(purchasePrice, purchaseQuantity, usedQuantity) {
  return (purchasePrice * usedQuantity) / purchaseQuantity;
}
```

- `function` declara una función: un cálculo al que le damos un nombre para poder reutilizarlo.
- `calculateIngredientCost` es el nombre elegido: calcular el costo de un ingrediente.
- Los nombres entre paréntesis son parámetros. Representan los valores que recibe la función cada vez que se usa.
- `return` devuelve el resultado a la parte del programa que llamó a la función. No lo muestra en pantalla ni lo guarda en una base de datos.

Los parámetros corresponden a datos que ya definimos:

| Parámetro | De dónde sale |
|---|---|
| `purchasePrice` | Precio total de compra del insumo |
| `purchaseQuantity` | Cantidad comprada del insumo |
| `usedQuantity` | Cantidad utilizada en la receta |

## Cómo se usa

Para la bolsa de 2,5 kg de harina por $6.000 y un uso de 375 g, primero expresamos las dos cantidades en gramos:

```js
const ingredientCost = calculateIngredientCost(6000, 2500, 375);
// ingredientCost vale 900.
```

Esta línea llama a la función. Los argumentos se asignan por posición: `6000` a `purchasePrice`, `2500` a `purchaseQuantity` y `375` a `usedQuantity`. `const` declara una variable que conserva el resultado de esa llamada; no se puede reasignar después.

El resultado es el número `900`, sin símbolo de moneda. La pantalla será la responsable de mostrarlo como un importe en pesos. Así podemos sumarlo a otros costos sin interpretar texto.

La función usa los valores recibidos en esa llamada. Si cambia el precio de compra, hay que volver a llamarla con el precio nuevo para obtener otro resultado: una variable calculada no se actualiza sola.

## Alcance de este primer ejemplo

Esta versión supone que las entradas ya son números válidos, que el precio y la cantidad usada no son negativos, que la cantidad comprada es mayor que cero y que ambas cantidades están en la misma unidad. Todavía no valida esos requisitos ni convierte unidades: es un ejemplo de la regla central, no una función terminada para aceptar datos de un formulario.

Por eso pasamos `2500` y `375`, ambos en gramos. Pasar `2.5` y `375` mezclaría kg y g y daría un resultado incorrecto.

El siguiente paso de código será incorporar validación y conversión usando las unidades que guardamos en el modelo. Después prepararemos el entorno para ejecutarlo y conectarlo con una pantalla. Las herramientas y sus responsabilidades se explicarán antes de incorporarlas.

## Decisión de diseño

Esta función no necesita conocer el nombre de la harina, el identificador de la receta ni el envase. Recibe únicamente lo que interviene en su cálculo y no modifica el insumo ni la receta.

Separar el cálculo de la pantalla permite comprobar la regla por sí sola y usarla desde distintas partes de la aplicación.
