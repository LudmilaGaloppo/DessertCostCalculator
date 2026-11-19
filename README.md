# ProyectoDessertsCost

Proyecto personal de Ludmila para aprender a desarrollar una aplicación propia de costos de pastelería, entendiendo las reglas del negocio y las decisiones técnicas.

## Objetivo

Registrar insumos y sus precios de compra, calcular el costo de las cantidades utilizadas en cada receta, sumar los gastos de elaboración y comparar precios de venta y ganancias estimadas según distintas presentaciones.

Uso inicial: personal. Posible evolución: que otros emprendedores puedan utilizarla.

## Estado actual

- Alcance inicial documentado a partir de la conversación.
- Primer ejercicio revisado y cerrado con una corrección numérica: el segundo costo es $360, no $369. Procedimiento proporcional y distinción entre receta y elaboración comprendidos para el ejemplo.
- Modelos de insumo y receta propuestos por Ludmila y revisados. Se incorporaron unidad de uso, rendimiento y venta de cookies por unidad o en cajas con cantidad elegida al cotizar; ver [la devolución del modelo](docs/02-modelo-de-datos.md). Quedan detalles de costos y packaging por resolver.
- Implementado el [cálculo de ingredientes de una receta](docs/04-calculo-de-receta.md): conversión de unidades, validación, desglose y subtotal. Nueve pruebas verificadas.
- Primera pantalla local en React, TypeScript y Vite: [calculadora de un ingrediente](docs/05-primera-pantalla.md), con datos de compra y uso, resultado, ejemplo y errores. Datos solo en memoria; almacenamiento pendiente.
- Compilación y 13 pruebas verificadas. Servidor local con respuesta HTTP 200; revisión visual e interactiva pendiente por un fallo del entorno de navegador.
- Desde esta carpeta: `npm ci` para instalar las versiones del lockfile en otro equipo, `npm run dev` para abrir la web, `npm run typecheck` para revisar tipos, `npm test` para probar y `npm run example` para el ejemplo de consola. `npm run build` genera la web en `dist/`. Requiere Node.js 22 o posterior.

## Por dónde empezar

1. Leer [el alcance y las decisiones pendientes](docs/alcance.md).
2. Realizar [el primer ejercicio: insumos y costo proporcional](docs/01-insumos-y-costo-proporcional.md).
3. Consultar [la devolución y las decisiones del modelo de datos](docs/02-modelo-de-datos.md).
4. Continuar con [el código ejecutable y sus decisiones](docs/04-calculo-de-receta.md). La [primera función explicada](docs/03-primera-funcion.md) queda como material introductorio opcional. El recorrido completo está en [el plan de aprendizaje](docs/plan-de-aprendizaje.md).
5. Abrir [la primera pantalla y su recorrido de datos](docs/05-primera-pantalla.md).

## Cómo vamos a trabajar

- Avanzar por bloques funcionales completos, explicando decisiones de diseño y cómo comprobar el resultado.
- Asumir conocimiento de funciones, objetos y arrays. No repasar sintaxis básica ni frenar el avance con preguntas obvias; profundizar cuando Ludmila lo solicite o surja una dificultad concreta.
- Usar TypeScript y tomar `superball/admin` como referencia de convenciones. Explicar las estructuras y herramientas nuevas cuando se introduzcan, con su propósito en este proyecto; conocer funciones no implica conocer `Map`, `Record` u otros recursos nuevos.
- Priorizar ejemplos de código explicados, decisiones de diseño y revisión de las propuestas de Ludmila. Evitar preguntas de aritmética o pedir que adivine una solución ya conocida; los intentos propios se proponen cuando aportan práctica concreta de programación.
- El código implementado en conjunto se explica antes de dar la tarea por comprendida.
- Cada tecnología y carpeta se incorpora con una responsabilidad concreta.
- Escribir encima de cada función un comentario breve en español que indique para qué sirve y qué hace. Mantenerlo actualizado cuando cambie su comportamiento.
- Separar el estado «implementado» del estado «comprendido»: un cambio funcionando no demuestra aprendizaje por sí solo.
- Registrar las decisiones y las dudas que vayan apareciendo en estos documentos.

`superball/admin` es la referencia de convenciones elegida. Ya adoptamos React, React DOM, TypeScript y Vite, con la pantalla en `src/pages`, los tipos en `src/types` y la adaptación del formulario en `src/utils`. Las reglas de costo permanecen en `src/domain`. Rutas, estado global y almacenamiento se incorporarán cuando el recorrido los necesite.

El material de estudio de React Native y Expo aporta conceptos para comparar responsabilidades. El avance de este proyecto no implica completar ni aprobar los módulos de ese curso.
