# DessertCostCalculator

Proyecto personal de Ludmila para aprender a desarrollar una aplicación propia de costos de pastelería, entendiendo las reglas del negocio y las decisiones técnicas.

## Objetivo

Registrar insumos y sus precios de compra, calcular el costo de las cantidades utilizadas en cada receta, sumar los gastos de elaboración y comparar precios de venta y ganancias estimadas según distintas presentaciones.

Uso inicial: personal. Posible evolución: que otros emprendedores puedan utilizarla.

## Estado actual

- Alcance inicial documentado a partir de la conversación.
- Primer ejercicio revisado y cerrado con una corrección numérica: el segundo costo es $360, no $369. Procedimiento proporcional y distinción entre receta y elaboración comprendidos para el ejemplo.
- Modelos de insumo y receta propuestos por Ludmila y revisados. Se incorporaron unidad de uso, rendimiento y venta de cookies por unidad o en cajas con cantidad elegida al cotizar; ver [la devolución del modelo](docs/02-modelo-de-datos.md). Quedan detalles de costos y packaging por resolver.
- Implementado el [cálculo de ingredientes de una receta](docs/04-calculo-de-receta.md): conversión de unidades, validación, desglose y subtotal. Nueve pruebas verificadas.
- Primera pantalla local en React, TypeScript y Vite, con campos administrados por React Hook Form. El catálogo permite guardar, recuperar, editar y eliminar insumos en MongoDB local mediante una API Express y Mongoose. La eliminación se bloquea cuando una receta utiliza el insumo; ver [MongoDB y formularios](docs/06-mongodb-y-formularios.md).
- La pantalla de recetas permite agregar o quitar ingredientes, definir el rendimiento, calcular el desglose y crear, recuperar o actualizar recetas en MongoDB. Los costos se recalculan con los precios vigentes del catálogo; ver [recetas persistidas](docs/08-recetas-persistidas.md).
- Las recetas guardan horas de trabajo y usan una tarifa general persistida para calcular la mano de obra. Los datos faltantes se muestran como pendientes; ver [mano de obra](docs/09-mano-de-obra.md).
- El catálogo de packaging conserva compras, capacidades y stickers. La cotización calcula venta individual o en caja y rechaza superar la capacidad acordada; ver [packaging y cotización](docs/10-packaging-y-cotizacion.md).
- El costo de producción prorratea gas y electricidad a partir de promedios diarios configurables y minutos por receta; ver [energía estimada](docs/11-energia-estimada.md).
- La cotización permite [simular precios de venta](docs/12-precio-de-venta.md): sugerencia por recargo o margen y precio manual con ganancia o pérdida estimada, sin redondeo a múltiplos ni comisiones.
- Compilación y 35 pruebas verificadas. La simulación de precios se revisó visualmente en escritorio y móvil, y su recorrido interactivo se comprobó con respuestas de API simuladas. La integración real con MongoDB de insumos, recetas, configuración, energía, envases y stickers fue verificada en el bloque anterior.
- Frontend y backend separados en paquetes propios, conectados mediante npm workspaces. Los contratos de datos compartidos están en `shared/`; ver [la estructura del proyecto](docs/07-estructura-del-proyecto.md).
- Desde esta carpeta: `npm ci` instala todos los paquetes, `npm run dev` inicia la web, `npm run typecheck` revisa tipos, `npm test` prueba ambas partes y `npm run example` ejecuta el ejemplo de consola. `npm run build` genera la web en `frontend/dist/` y la API en `backend/dist/`. Requiere Node.js 22 o posterior.
- Para el catálogo, MongoDB debe estar activo y la API debe iniciarse en otra terminal con `npm run dev:api`. Conexión local predeterminada: `mongodb://127.0.0.1:27017/dessert_cost_calculator`; `backend/.env.example` permite configurarla mediante `backend/.env`. `npm run test:integration` comprueba persistencia en una base temporal propia.

## Por dónde empezar

1. Leer [el alcance y las decisiones pendientes](docs/alcance.md).
2. Realizar [el primer ejercicio: insumos y costo proporcional](docs/01-insumos-y-costo-proporcional.md).
3. Consultar [la devolución y las decisiones del modelo de datos](docs/02-modelo-de-datos.md).
4. Continuar con [el código ejecutable y sus decisiones](docs/04-calculo-de-receta.md). La [primera función explicada](docs/03-primera-funcion.md) queda como material introductorio opcional. El recorrido completo está en [el plan de aprendizaje](docs/plan-de-aprendizaje.md).
5. Abrir [la primera pantalla y su recorrido de datos](docs/05-primera-pantalla.md).
6. Revisar [MongoDB local y React Hook Form](docs/06-mongodb-y-formularios.md).
7. Consultar [la separación de frontend, backend y tipos compartidos](docs/07-estructura-del-proyecto.md).
8. Revisar [el formulario dinámico y la persistencia de recetas](docs/08-recetas-persistidas.md).
9. Continuar con [mano de obra y costo parcial de producción](docs/09-mano-de-obra.md).
10. Revisar [packaging y costo de una cotización](docs/10-packaging-y-cotizacion.md).
11. Entender [la estimación sencilla de gas y electricidad](docs/11-energia-estimada.md).
12. Comparar [precio sugerido, precio manual, recargo y margen](docs/12-precio-de-venta.md).

Referencia de apoyo: [Git y GitHub Desktop, guía rápida](docs/git-y-github-desktop.md).

## Cómo vamos a trabajar

- Avanzar por bloques funcionales completos, explicando decisiones de diseño y cómo comprobar el resultado.
- Asumir conocimiento de funciones, objetos y arrays. No repasar sintaxis básica ni frenar el avance con preguntas obvias; profundizar cuando Ludmila lo solicite o surja una dificultad concreta.
- Usar TypeScript y tomar `superball/admin` como referencia de convenciones. Explicar las estructuras y herramientas nuevas cuando se introduzcan, con su propósito en este proyecto; conocer funciones no implica conocer `Map`, `Record` u otros recursos nuevos.
- Priorizar ejemplos de código explicados, decisiones de diseño y revisión de las propuestas de Ludmila. Evitar preguntas de aritmética o pedir que adivine una solución ya conocida; los intentos propios se proponen cuando aportan práctica concreta de programación.
- El código implementado en conjunto se explica antes de dar la tarea por comprendida.
- Cada tecnología y carpeta se incorpora con una responsabilidad concreta.
- Escribir encima de cada función un comentario breve en español que indique para qué sirve y qué hace. Mantenerlo actualizado cuando cambie su comportamiento.
- Usar React Hook Form en los formularios y MongoDB para la persistencia; el navegador accede a los datos a través de la API, nunca directamente a la base.
- Mantener el frontend en `frontend/` y el backend en `backend/`, con dependencias y configuraciones propias. Compartir contratos en `shared/`; ninguna aplicación debe importar archivos internos de la otra.
- Separar el estado «implementado» del estado «comprendido»: un cambio funcionando no demuestra aprendizaje por sí solo.
- Registrar las decisiones y las dudas que vayan apareciendo en estos documentos.
- Al terminar cada bloque de cambios, proponer nombres de commits en inglés y explicar qué archivos o cambios agrupar en cada uno. Preferir commits coherentes que dejen el proyecto funcionando y agrupaciones fáciles de seleccionar desde GitHub Desktop. Sugerirlos no implica hacer commits ni subirlos automáticamente.

`superball/admin` es la referencia de convenciones elegida. Su equivalente aquí es `frontend/`, con React, TypeScript, Vite y React Hook Form. La API está en `backend/` y usa Express y Mongoose; `superball/backend` usa NestJS. Compartimos la separación de responsabilidades, sin copiar todas las herramientas de ese proyecto. Rutas de pantalla y estado global se incorporarán cuando el recorrido los necesite.

El material de estudio de React Native y Expo aporta conceptos para comparar responsabilidades. El avance de este proyecto no implica completar ni aprobar los módulos de ese curso.
