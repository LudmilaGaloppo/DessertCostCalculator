# MongoDB local y React Hook Form

Estado: primera persistencia implementada para el catálogo de insumos. MongoDB local está disponible en esta computadora. Se verificaron compilación, 18 pruebas sin base de datos y una prueba de integración contra MongoDB real. La página y `/api/supplies` respondieron HTTP 200 a través de Vite. La revisión visual e interactiva sigue pendiente por un fallo de la herramienta del navegador.

## Cómo iniciar el proyecto

Desde `DessertCostCalculator`, abrí dos terminales:

```powershell
# Terminal 1: backend, conectado a MongoDB local
npm run dev:api
```

```powershell
# Terminal 2: frontend
npm run dev
```

MongoDB debe estar funcionando. La API escucha en `127.0.0.1:3001`; Vite muestra la dirección del frontend. Detené cada proceso con Ctrl+C.

La conexión predeterminada es `mongodb://127.0.0.1:27017/dessert_cost_calculator`. La colección se llama `supplies`. Podés abrir esa dirección en MongoDB Compass para inspeccionarla; Compass es el cliente, no reemplaza al servicio de MongoDB.

Para cambiar la conexión, copiá `backend/.env.example` a `backend/.env` y editá `MONGODB_URI`. No hace falta hacerlo para la conexión local predeterminada. `.env` y sus variantes están ignorados por Git. Si cambiás `API_PORT`, también actualizá el destino del proxy en `frontend/vite.config.ts`. La separación de carpetas está explicada en [estructura del proyecto](07-estructura-del-proyecto.md).

## Qué se puede guardar

- **Guardar insumo:** crea un documento con nombre, cantidad comprada, unidad y precio de compra.
- **Cargar un insumo:** recupera esos datos desde el selector del catálogo.
- **Actualizar insumo guardado:** reemplaza los datos de compra del insumo seleccionado, conservando su ID.
- **Limpiar:** inicia una entrada nueva; no elimina documentos de MongoDB.

Los registros no se deduplican por nombre: podés tener distintas marcas o presentaciones. Para modificar un insumo existente, primero seleccionalo en el catálogo.

La cantidad utilizada y el costo calculado siguen perteneciendo a esta simulación y no se guardan. Recetas completas, presupuestos históricos y usuarios todavía no están implementados. El cálculo proporcional funciona sin la API; el catálogo informa un error y permite reintentar con «Actualizar lista».

## Cómo se conectan las partes

```text
React Hook Form → servicio HTTP del frontend → API Express → modelo Mongoose → MongoDB
```

| Pieza | Responsabilidad |
|---|---|
| [IngredientCalculator.tsx](../frontend/src/pages/IngredientCalculator.tsx) | Formulario, errores por campo, selección del catálogo y resultados |
| [services/supplies.ts](../frontend/src/services/supplies.ts) | Peticiones HTTP para listar, crear y actualizar insumos |
| [backend/src/app.ts](../backend/src/app.ts) | Rutas y respuestas de la API |
| [backend/src/supplies/validation.ts](../backend/src/supplies/validation.ts) | Valida datos externos antes de escribir en la base |
| [backend/src/supplies/repository.ts](../backend/src/supplies/repository.ts) | Esquema y operaciones de MongoDB mediante Mongoose |
| [backend/src/index.ts](../backend/src/index.ts) | Conexión a MongoDB, inicio y cierre de la API |

El navegador usa rutas `/api/...`. El proxy de Vite reenvía esas peticiones al backend; la URI de MongoDB solo se utiliza en el servidor. No se debe definir como una variable `VITE_`, porque esas variables pueden terminar en el código del navegador.

## React Hook Form: lo nuevo

`useForm<IngredientFormValues>()` administra los valores y errores del formulario. Los textos ya no se guardan en un `useState` propio. El estado del resultado y del catálogo sigue perteneciendo a React.

| Recurso | Uso concreto |
|---|---|
| `register('name', reglas)` | Conecta el input a React Hook Form y establece sus validaciones |
| `handleSubmit(onCalculate)` | Valida los campos antes de ejecutar el cálculo |
| `formState.errors` | Contiene los mensajes mostrados junto a cada campo |
| `reset(valores)` | Limpia el formulario o carga un insumo seleccionado |
| `getValues()` | Lee los valores actuales para preparar el guardado |
| `trigger([...campos])` | Valida solo los datos de compra cuando guardamos; no exige completar el uso |
| `setError('root.calculation', ...)` | Muestra un error que afecta al cálculo completo, como kg frente a ml |
| `clearErrors('root')` | Retira el error general cuando se vuelve a editar |

Se mantienen los campos numéricos como texto hasta validarlos, para admitir coma decimal y distinguir vacío de cero. Los campos comunes utilizan `register`; no necesitamos `Controller` para inputs y selects nativos. [Documentación de register](https://react-hook-form.com/docs/useform/register). El envío usa `handleSubmit` y captura errores del cálculo de forma explícita. [Documentación de handleSubmit](https://react-hook-form.com/docs/useform/handlesubmit).

`useEffect` carga el catálogo al abrir la pantalla; `AbortController` cancela la petición si se desmonta. `useRef` conserva un bloqueo inmediato para evitar guardados dobles durante la misma solicitud; `isSaving` controla lo que se muestra y deshabilita los campos durante el envío.

## MongoDB, Mongoose y API

MongoDB guarda documentos. Mongoose permite definir su estructura mediante un **schema** y operar sobre una colección mediante un **model**. TypeScript describe los datos durante el desarrollo; el schema y las validaciones de la API comprueban los datos en ejecución. [Guía de Mongoose con TypeScript](https://mongoosejs.com/docs/typescript.html).

`SupplyInput` contiene los datos de compra que podemos enviar. `Supply` agrega el `id` del documento guardado. MongoDB genera `_id`; el backend lo transforma a `id: string` para conservar el modelo de la calculadora. Los timestamps de Mongoose registran creación y última actualización.

| Petición | Resultado |
|---|---|
| `GET /api/supplies` | Devuelve `{ supplies: [...] }` |
| `POST /api/supplies` | Crea un documento y devuelve `{ supply: ... }` con HTTP 201 |
| `PUT /api/supplies/:id` | Actualiza sus datos y devuelve `{ supply: ... }` |

Las entradas inválidas reciben HTTP 400, un insumo ausente recibe 404 y un fallo de acceso al catálogo recibe 503. Express 5 lleva los errores de las rutas asíncronas al manejador de errores de la API. [Guía de errores de Express](https://expressjs.com/en/guide/error-handling.html).

Tomamos React Hook Form y Mongoose de las convenciones de `superball`. Esta API utiliza Express directamente; `superball/backend` utiliza NestJS sobre una estructura más grande. La API actual es de uso local, escucha solo en esta computadora y todavía no tiene autenticación.

## Comprobaciones

```powershell
npm run build
npm test
npm run test:integration
```

La integración crea una base con un nombre aleatorio `dessert_cost_test_...`, comprueba creación, lectura desde otra conexión y actualización, y elimina únicamente esa base temporal al terminar. No inserta datos de prueba en `dessert_cost_calculator`.

`npm run build:node` también compila el servidor. `npm run start:api` permite ejecutar ese resultado compilado. `npm run dev:api` utiliza `tsx` para ejecutar TypeScript y el modo watch de Node para reiniciar cuando cambia el backend.
