# Cálculo de ingredientes de una receta

Estado: implementado y verificado con nueve pruebas. Este bloque abarca conversión de unidades, validaciones, relación entre catálogo y receta, desglose y subtotal de ingredientes. No representa todavía el costo completo de producción.

## Código y ejecución

- [Tipos del modelo](../src/types/costs.ts).
- [Lógica de costos](../src/domain/costs.ts).
- [Ejemplo de receta y catálogo](../examples/recipe-cost.ts).
- [Pruebas](../tests/costs.test.ts).

Desde la carpeta `ProyectoDessertsCost`:

```powershell
npm run typecheck
npm test
npm run example
```

Se utiliza TypeScript con modo estricto y Node.js 22 o posterior. En un equipo nuevo, ejecutar primero `npm ci`. `typescript` revisa los tipos y genera JavaScript; `@types/node` describe las APIs de Node para el compilador. Son dependencias de desarrollo.

`npm run typecheck` revisa tipos sin generar archivos. Desde la incorporación de la pantalla, `npm run build` genera la web en `dist/`. `npm test` y `npm run example` compilan la lógica de Node a `.node-build/` antes de ejecutar. Se editan los archivos `.ts` y `.tsx`, no los `.js` generados. `dist/`, `.node-build/` y `node_modules/` están excluidos de Git; `package-lock.json` conserva las versiones instaladas.

Los imports locales terminan en `.js` porque esa es la extensión que Node ejecutará después de compilar. Con la configuración `NodeNext`, TypeScript resuelve esos imports contra los archivos `.ts` fuente. `import type` importa únicamente una definición de tipo y desaparece del JavaScript generado.

## Estructuras introducidas en esta migración

| Recurso | Para qué se usa acá |
|---|---|
| `interface Supply` y `interface RecipeIngredient` | Describen los campos del insumo y de su uso en una receta; mejoran el autocompletado y permiten detectar campos incorrectos antes de ejecutar |
| `type Unit = 'g' \| 'kg' \| 'ml' \| 'l' \| 'unit'` | Unión de valores permitidos: por ejemplo, escribir `"gr"` en un objeto tipado produce un error de TypeScript |
| `Record<Unit, UnitDefinition>` | Tipo de un objeto que debe contener una definición por cada unidad; reemplaza el primer `Map` de la versión anterior |
| `Map<string, Supply>` | Colección dinámica que relaciona cada ID con un insumo. `set` agrega, `has` comprueba existencia y `get` busca por ID |
| `readonly RecipeIngredient[]` | Impide modificar ese array a través de esa referencia en TypeScript; no congela los objetos en ejecución |
| `unknown` | Permite que las validaciones examinen un valor cuyo tipo todavía no se da por válido |

`IngredientCost extends RecipeIngredient` reutiliza los campos de uso y agrega nombre y costo al resultado. `Recipe` representa por ahora la parte implementada del modelo: identificador, nombre e ingredientes. Los campos de elaboración y venta se incorporarán al desarrollar esos cálculos.

La función de subtotal recibe únicamente la propiedad `ingredients`: no necesita el nombre o el ID de la receta para calcular. Un objeto `Recipe` completo también sirve como entrada.

Los tipos no validan por sí solos datos de formularios o archivos en ejecución. Por eso se conservan las validaciones y las pruebas de datos inválidos. En esas pruebas, `@ts-expect-error` señala una llamada inválida intencional: permite comprobar el rechazo en ejecución y exige que TypeScript siga detectando el error de tipos. Las conversiones `as Unit` de las pruebas también son intencionales para simular texto externo inválido; no convierten ni validan un valor.

## Vocabulario del código

Estos son nombres elegidos para el modelo del proyecto, no palabras especiales de JavaScript:

| Nombre | Significado en este proyecto |
|---|---|
| `supply` | Un insumo del catálogo, con identificador, nombre, cantidad comprada, unidad de compra y precio total de compra |
| `supplies` | Plural de `supply`: el array de insumos del catálogo |
| `ingredient` | El uso de un insumo dentro de una receta: referencia al insumo, cantidad utilizada y unidad de uso |
| `supplyId` | Identificador del insumo referenciado; debe coincidir con el `id` de un elemento del catálogo |

Por ejemplo, `supply` puede describir una compra de 2,5 kg de harina por $6.000, mientras que `ingredient` indica que una receta utiliza 375 g de esa harina. La relación es `ingredient.supplyId === supply.id`.

Usamos dos nombres porque representan datos distintos del mismo producto: el insumo aporta los datos de compra y el ingrediente aporta los datos de uso. El precio no se copia al ingrediente; se consulta en el catálogo. El ejemplo completo está en [recipe-cost.ts](../examples/recipe-cost.ts).

## Decisiones del modelo

| Decisión | Motivo |
|---|---|
| El catálogo guarda `purchaseQuantity`, `purchaseUnit` y `purchasePrice` | Mantiene una referencia de compra reutilizable |
| La receta guarda `supplyId`, `quantity` y `unit` por ingrediente | Evita copiar el precio en cada receta |
| Se usan propiedades en camelCase en el código | Unifica los nombres; las tablas originales quedan como historial |
| El uso se convierte a la unidad de compra antes de dividir | Permite combinar kg/g y l/ml, en ambos sentidos |
| Se rechazan conversiones entre masa, volumen y unidades | No conocemos densidad ni peso por pieza de cada insumo |
| Se devuelve `ingredientsSubtotal` y el desglose por ingrediente | Expresa exactamente qué costos incluye y permite mostrarlos en pantalla |
| Se permiten cero explícito en precio o uso, pero no en cantidad comprada | Un valor faltante no se transforma silenciosamente en cero |
| No se limita el uso a la cantidad de compra | Estamos calculando costos con un precio de referencia, no descontando stock |

La función falla con un error si falta un insumo, hay identificadores duplicados o las entradas son inválidas. La futura pantalla deberá mostrar ese error al usuario. Los campos de formulario tendrán que convertirse a números explícitamente: el cálculo rechaza texto como `"375"`.

Se calculan los importes sin redondear cada ingrediente. La política monetaria y el redondeo comercial siguen pendientes; esta versión usa números de JavaScript y no pretende resolver aún precisión decimal contable.

## Resultado del ejemplo

El catálogo contiene harina de 2,5 kg a $6.000 y azúcar de 1 kg a $2.000. La receta ilustrativa utiliza 375 g de harina y 150 g de azúcar.

- Harina: $900.
- Azúcar: $300.
- Subtotal de ingredientes: $1.200.

Al cambiar un precio del catálogo y volver a calcular, cambia el resultado. La receta conserva sus cantidades y referencias. Este ejemplo no guarda presupuestos históricos.

## Próximo bloque

La lógica ya está conectada a [la primera pantalla de compra y uso](05-primera-pantalla.md), que muestra resultados y errores. Trabajo, energía, rendimiento y packaging se integrarán después sobre este subtotal.
