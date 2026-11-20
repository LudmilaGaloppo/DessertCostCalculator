# Plan de aprendizaje y construcción

Objetivo: poder explicar y modificar lo que construimos. Las etapas son una propuesta de trabajo, no una lista de conocimientos ya comprobados.

## Etapa 1. Datos y reglas del negocio

- Ejercicio actual: [insumos y costo proporcional](01-insumos-y-costo-proporcional.md).
- Seguimiento del 10/11/2026: primer ejercicio cerrado con una corrección numérica ($360 en la segunda receta, frente a $369 escrito). Procedimiento proporcional correcto y distinción entre guardar la receta y consumir insumos comprobada para el ejemplo. Se explicó el límite de un booleano `isCooked` para registrar elaboraciones repetidas. Próximo paso: primer modelo de datos; quedan por practicar otros casos de unidades y validación.
- Modelos de insumo y receta recibidos y revisados: [devolución y ajustes](02-modelo-de-datos.md). Pendiente comprobar unidad de uso y costo proporcional en el modelo. Se explicó la separación entre rendimiento y presentación, datos ingresados y resultados calculados, y costos de trabajo/energía y ganancia. La explicación no se registra todavía como comprensión comprobada de esos puntos.
- Diferenciar una compra de insumo de su uso en una receta.
- Resolver ejemplos de peso y unidades a mano, incluidos datos faltantes y unidades incompatibles.

Resultado: datos necesarios y cálculos esperados escritos y comprendidos. Todavía no hace falta elegir bibliotecas.

## Etapa 2. Herramientas y primera función

Implementado: [cálculo de ingredientes de una receta](04-calculo-de-receta.md), con conversiones, validaciones, desglose y subtotal. Código, ejemplo y nueve pruebas del cálculo migrados a TypeScript estricto. El código de la pantalla y sus cálculos están en `frontend/`, la API en `backend/` y los contratos comunes en `shared/`; ver [estructura del proyecto](07-estructura-del-proyecto.md). La [introducción a la primera función](03-primera-funcion.md) queda como material opcional. El catálogo ya tiene persistencia MongoDB, documentada en las etapas siguientes.

Comparar las responsabilidades de JavaScript, TypeScript, React, React DOM y Vite para la propuesta web. Relacionarlas con React Native y Expo del material de estudio, aclarando qué conocimientos se comparten y qué herramientas cambian según la plataforma.

Revisar una parte pequeña de `superball/admin`, como su entrada y su ruteo, para entender sus decisiones antes de adoptar alguna convención.

Preparar el proyecto cuando esas decisiones estén explicadas. Implementar primero el cálculo proporcional en una función separada de la interfaz. Verificarlo con ejemplos conocidos y casos de error relevantes.

Resultado: poder señalar qué recibe y devuelve la función y qué aporta cada herramienta instalada.

## Etapa 3. Primer recorrido en pantalla

Implementada [la primera pantalla](05-primera-pantalla.md) con React, TypeScript y Vite. Incluye formulario, costo, errores y ejemplo. Compilación y 13 pruebas verificadas; respuesta HTTP 200 del servidor local. Revisión visual e interactiva pendiente por un fallo del entorno de navegador. Se documentaron estado local, campos controlados y eventos en el contexto del recorrido.

Comportamiento implementado: editar un campo retira el resultado anterior; enviar el formulario calcula el nuevo costo o presenta el error. La implementación no se registra por sí sola como comprensión comprobada.

## Etapa 4. Catálogo, recetas y navegación

Implementado: catálogo de insumos y [recetas persistidas](08-recetas-persistidas.md), con creación, lectura, actualización y eliminación en MongoDB local. El catálogo también permite eliminar insumos sin uso y protege los que estén referenciados por una receta. Eliminar una receta conserva sus insumos. React Hook Form administra los campos y `useFieldArray` las filas de ingredientes. La navegación separa Insumos de Recetas y cada cálculo consulta los precios actuales del catálogo.

Guardar varios insumos en el estado de la aplicación, seleccionarlos en una receta y obtener su subtotal. Introducir identificadores y relaciones entre datos. Incorporar navegación cuando haya pantallas con responsabilidades distintas.

Resultado: reutilizar un insumo en distintas recetas y explicar de dónde sale cada costo.

## Etapa 5. Elaboración, presentaciones y precios

Implementados [mano de obra](09-mano-de-obra.md), [energía estimada](11-energia-estimada.md), [packaging con costo por cantidad vendida](10-packaging-y-cotizacion.md) y [simulación de precios de venta](12-precio-de-venta.md). Cada receta guarda tiempos de trabajo y artefactos; la configuración conserva tarifa y promedios diarios; el catálogo conserva envases y stickers. Los resultados distinguen datos pendientes de costos cero. La simulación sugiere un precio por recargo o margen y permite evaluar un precio manual con su ganancia o pérdida, sin redondeo a múltiplos ni comisiones. Guardar presupuestos sigue pendiente. Implementado no equivale a comprensión comprobada.

Agregar trabajo, energía, rendimiento vendible, envases y otros gastos acordados. Calcular por peso, piezas y producto completo. Comparar recargo y margen sin fijar un porcentaje universal.

Resultado: explicar cuánto cuesta la presentación, qué gastos incluye y qué diferencia queda al precio elegido.

## Etapa 6. Persistencia y uso personal

MongoDB local ya persiste el catálogo y las recetas. Quedan los presupuestos, el respaldo y el historial de precios. Verificar el recorrido con recetas reales y revisar el uso desde un celular.

Resultado: recuperar los datos al volver y conocer los límites de esa primera versión.

## Etapa 7. Publicación y evolución

Entender cómo se prepara y publica la web. Evaluar las necesidades para que otras personas puedan usarla, como cuentas y separación de datos, después de validar el uso personal.

## Forma de acompañamiento

1. Avanzar por bloques funcionales completos y explicar las decisiones técnicas relevantes.
2. Usar TypeScript y las convenciones pertinentes de `superball/admin`. Asumir conocimientos de funciones, objetos y arrays; explicar las estructuras nuevas al introducirlas (por ejemplo, `Map`, `Record` o tipos específicos), con su propósito en la aplicación.
3. Revisar las propuestas de Ludmila con correcciones concretas. Proponer práctica de programación cuando aporte aprendizaje; evitar preguntas de aritmética y adivinanzas sobre soluciones conocidas.
4. Registrar decisiones y dudas pendientes, sin convertir cada explicación en un examen ni exigir una reformulación para avanzar.
5. Continuar cuando corresponda, sin marcar comprensión solo porque exista código funcionando.

El tamaño de cada etapa se ajustará a las dudas que aparezcan. No hay fechas impuestas ni tareas de otras etapas consideradas realizadas.
