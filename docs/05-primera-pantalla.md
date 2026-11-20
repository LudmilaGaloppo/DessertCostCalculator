# Primera pantalla: calculadora de un ingrediente

Actualización: el formulario ahora utiliza React Hook Form y el catálogo se guarda en MongoDB local. El estado vigente, los comandos y las responsabilidades están en [MongoDB local y formularios](06-mongodb-y-formularios.md). Este documento conserva la explicación de la primera versión.

Estado: implementada localmente con React, TypeScript y Vite. Compilación correcta, 13 pruebas aprobadas (9 del cálculo y 4 de la entrada del formulario) y respuesta HTTP 200 del servidor. La verificación visual e interactiva en navegador quedó pendiente por un fallo del entorno de automatización.

## Abrir la aplicación

Desde `ProyectoDessertsCost`:

```powershell
npm run dev
```

Abrí la dirección local que muestra Vite. El botón «Cargar ejemplo» usa la compra de 2,5 kg de harina a $6.000 y un consumo de 375 g: muestra $900. «Limpiar» permite comenzar de nuevo. Para detener el servidor, usá Ctrl+C en esa terminal.

## Qué hace cada parte

| Archivo | Responsabilidad |
|---|---|
| [main.tsx](../src/main.tsx) | Conecta React con el contenedor HTML y monta `App` |
| [App.tsx](../src/App.tsx) | Compone la pantalla inicial |
| [IngredientCalculator.tsx](../src/pages/IngredientCalculator.tsx) | Maneja los campos, los eventos y la presentación del resultado o error |
| [ingredient-form.ts](../src/utils/ingredient-form.ts) | Convierte el texto ingresado a datos válidos y llama al cálculo |
| [costs.ts](../src/domain/costs.ts) | Conserva las reglas de conversión y costo, independientes de React |
| [ingredient-form.ts (tipos)](../src/types/ingredient-form.ts) | Distingue los textos editables del formulario de los números y unidades del resultado |

Recorrido: editar campos → enviar formulario → validar y convertir textos → calcular costo → mostrar resultado.

## Conceptos nuevos, aplicados acá

- **TSX:** TypeScript con marcado JSX para describir la pantalla. Los cálculos que no contienen interfaz siguen en `.ts`.
- **`useState`:** mantiene los campos, el resultado y el error mientras la pantalla está abierta. Al cambiar ese estado, React actualiza lo que muestra. No guarda información después de recargar.
- **Campos controlados:** cada `input` recibe su `value` del estado y usa `onChange` para actualizarlo. Guardamos texto mientras se edita para que un campo vacío siga vacío, en lugar de transformarse en cero.
- **`onSubmit` y `preventDefault`:** permiten procesar el formulario sin recargar la página. `try/catch` convierte un error de validación en un mensaje visible.
- **`Intl.NumberFormat`:** presenta los importes como pesos argentinos. El formato visual no cambia el número utilizado en los cálculos.
- **`StrictMode`:** activa comprobaciones adicionales de React en desarrollo para ayudar a detectar problemas. No agrega una pantalla ni un estado de negocio.

La pantalla retira el resultado cuando se edita cualquier campo: así no muestra un importe calculado con datos anteriores. Para obtener el nuevo costo, se vuelve a enviar el formulario.

## Decisiones de esta versión

Se aceptan coma o punto decimal, sin separadores de miles. Los campos vacíos, las cantidades negativas, la compra igual a cero y las unidades incompatibles muestran errores. Un precio cero explícito sigue siendo válido, conforme a la regla del cálculo existente.

El resultado representa únicamente el costo del insumo utilizado. Esta pantalla todavía no guarda un catálogo, no administra recetas completas y no calcula trabajo, energía, packaging ni precio de venta. El identificador `current-supply` es local a la simulación.

Adoptamos React, TypeScript y Vite siguiendo la referencia de `superball/admin`. La carpeta `pages` contiene la pantalla; `types`, los contratos de datos; `utils`, la adaptación del formulario. Conservamos `domain` para las reglas del negocio. No incorporamos router ni estado global porque hay una sola pantalla y su estado es local.

## Herramientas y comprobaciones

- React describe la interfaz y sus actualizaciones; React DOM la monta en el navegador.
- Vite inicia el servidor de desarrollo y genera la web en `dist/` con `npm run build`.
- `tsconfig.app.json` comprueba los archivos de la web, incluyendo TSX, usando resolución de módulos para Vite.
- `tsconfig.json` compila la lógica, los ejemplos y las pruebas para Node en `.node-build/`. Se conservan los imports `.js` de la lógica compartida para que Node pueda ejecutarla; Vite también los resuelve.
- `npm run typecheck` comprueba ambas configuraciones; `npm test` ejecuta las 13 pruebas; `npm run example` conserva el ejemplo de consola.

## Próximo bloque

Convertir la entrada de un insumo en un catálogo reutilizable y seleccionar varios insumos para armar una receta. La persistencia se elegirá de forma explícita cuando se incorpore el guardado.
