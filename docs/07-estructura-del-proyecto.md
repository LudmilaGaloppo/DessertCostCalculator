# Estructura: frontend y backend separados

La organización sigue la separación de aplicaciones que usamos como referencia en `superball`: una carpeta para la web y otra para la API. Cada una tiene su `package.json`, configuración de TypeScript y pruebas.

```text
DessertCostCalculator/
├── frontend/
│   ├── src/                 # React, formularios, servicios HTTP y cálculo de costos
│   ├── tests/               # Pruebas de cálculo y adaptación de formularios
│   ├── examples/            # Ejemplo ejecutable por consola
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json        # Comprobación de la web
│   ├── tsconfig.tests.json  # Compilación de ejemplos y pruebas para Node
│   └── package.json
├── backend/
│   ├── src/                 # API Express, validación y acceso a MongoDB
│   ├── tests/               # Pruebas HTTP, validación e integración con MongoDB
│   ├── .env.example
│   ├── tsconfig.json        # Compilación de la API
│   ├── tsconfig.tests.json  # Compilación de las pruebas
│   └── package.json
├── shared/
│   ├── src/costs.d.ts       # Contratos de datos que necesitan ambas aplicaciones
│   └── package.json
├── docs/
├── tsconfig.base.json       # Reglas de TypeScript comunes
├── package.json             # Workspaces y atajos para ejecutar desde la raíz
└── package-lock.json        # Versiones exactas de todos los paquetes
```

## Por qué existe shared

`Supply`, `SupplyInput` y `Unit` describen los datos que la API intercambia con la pantalla. Vivían dentro del frontend y el backend los importaba desde allí. Ahora tienen un lugar compartido y ambas partes los consumen así:

```ts
import type { Supply } from '@dessert-cost/shared';
```

`@dessert-cost/shared` es un paquete local de este repositorio, no una dependencia publicada. Su archivo `.d.ts` solo declara tipos: no contiene lógica ejecutable ni genera JavaScript. Por eso se utiliza mediante `import type` y no necesita un servidor ni una compilación previa.

Los tipos específicos del formulario siguen en `frontend/src/types`. Los esquemas de MongoDB pertenecen al backend. Las funciones de costo siguen en `frontend/src/domain`, porque actualmente la calculadora es quien las ejecuta.

## Qué son los workspaces

Los workspaces de npm permiten manejar varios paquetes locales desde la raíz de un repositorio. Cada aplicación declara sus dependencias: React y React Hook Form en frontend; Express y Mongoose en backend.

`npm ci` desde la raíz instala y enlaza los tres paquetes. npm puede colocar dependencias en el `node_modules` de la raíz para compartir instalaciones; esto no mezcla los archivos fuente ni las responsabilidades. Se conserva un único `package-lock.json`.

## Comandos

Desde la raíz, se mantienen los comandos conocidos:

| Comando | Qué ejecuta |
|---|---|
| `npm run dev` | Frontend con Vite |
| `npm run dev:api` | Backend en desarrollo, en otra terminal |
| `npm run typecheck` | Tipos de todos los paquetes |
| `npm run build` | Frontend en `frontend/dist` y backend en `backend/dist` |
| `npm test` | 15 pruebas del frontend y 3 del backend |
| `npm run test:integration` | Prueba de persistencia con una base MongoDB temporal |
| `npm run example` | Ejemplo de consola del frontend |
| `npm run preview` | Vista previa de la web compilada |
| `npm run start:api` | API compilada; requiere ejecutar antes `npm run build` |

También podés entrar a `frontend` o `backend` y ejecutar `npm run dev` desde allí. Los scripts de la raíz son atajos: por ejemplo, `npm run dev --workspace frontend` ejecuta el script `dev` del paquete frontend, con esa carpeta como directorio de trabajo.

Si había servidores activos antes de reorganizar las carpetas, detenelos y volvé a iniciarlos con los comandos actuales.

## Conexión y pruebas

La configuración de MongoDB se guarda en `backend/.env`, usando `backend/.env.example` como referencia. Los comandos de la API leen ese archivo incluso cuando se lanzan desde la raíz. La conexión local predeterminada sigue funcionando sin un `.env`.

El proxy de la web vive en `frontend/vite.config.ts`. La pantalla continúa usando `/api/supplies` y el backend conserva sus rutas; esta reorganización no cambia el formato de datos ni el catálogo existente.

Las pruebas de formularios y de servidor quedaron separadas: ninguna prueba del backend importa archivos del frontend. Las salidas de compilación y los archivos `.env` siguen excluidos de Git.

Verificado después del cambio: tipos de los tres paquetes, ambas compilaciones, las 18 pruebas, la integración real con MongoDB y el ejemplo de consola.
