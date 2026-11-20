# Alcance inicial

Estado: requisitos recogidos de la conversación; detalles pendientes de validar al resolver ejemplos.

## Recorrido principal

Registrar una compra de insumo → seleccionar el insumo en una receta → indicar cuánto se utiliza → calcular costos → indicar el rendimiento vendible → elegir presentación → comparar precios y ganancias estimadas.

## Primera versión propuesta

### 1. Catálogo de insumos

Registrar nombre, cantidad comprada, unidad y precio total correspondiente a esa cantidad.

Ejemplo hipotético: harina, 5 kg, $10.000. Una receta que utiliza 500 g consume $1.000 de esa compra.

Un mismo insumo se puede utilizar en varias recetas. Registrar su precio de compra permite calcular el costo proporcional; el control de existencias queda como posible ampliación.

### 2. Recetas

Registrar nombre e ingredientes. Cada ingrediente de la receta referencia un insumo del catálogo y agrega la cantidad y unidad utilizadas.

Mostrar el costo de cada ingrediente y el subtotal de ingredientes. Registrar el rendimiento real del producto terminado: peso vendible y/o cantidad de piezas, según la receta y la presentación.

### 3. Elaboración y otros gastos

Contemplar energía, trabajo de elaboración, envases y otros gastos configurables.

Los minutos de gas necesitan una estimación monetaria para calcular un costo. El tiempo de trabajo y el tiempo de horno se registran por separado; pueden superponerse. Debemos definir cómo distribuir los gastos generales y evitar contar un mismo gasto dos veces.

Cuando falte un costo relevante, mostrar el resultado como parcial. Un dato desconocido no equivale a un costo de cero.

### 4. Presentaciones de venta

Permitir calcular por peso, pieza o producto completo. Los 100 g son un ejemplo de cantidad elegida, no una regla fija. Para venta por piezas, necesitamos conocer cuántas piezas vendibles produce la receta.

El envase y otros costos de venta se asignan a la presentación correspondiente: no todos aumentan en proporción a los gramos.

### 5. Simulación de precios

Comparar un precio elegido y/o un porcentaje deseado, mostrando qué costos se contemplaron y cuánto queda después de cubrirlos.

Distinguir explícitamente:

- Recargo sobre costo: precio = costo × (1 + recargo / 100).
- Margen sobre venta: precio = costo / (1 − margen / 100).

El 15 % fue un ejemplo. Los porcentajes serán configurables; todavía no existe un porcentaje recomendado para este emprendimiento. Hablar de ganancia estimada según los costos incluidos, sin presentar un subtotal de ingredientes como si fuera el costo completo.

### 6. Guardado

Poder recuperar insumos y recetas al volver a usar la aplicación. La forma de almacenamiento se elegirá cuando trabajemos esa etapa. Debemos explicar sus límites y cómo respaldar los datos.

## Reglas que debemos comprobar

- Normalizar kg a g y litros a mililitros antes de calcular proporciones.
- Mantener separadas las magnitudes de peso, volumen y cantidad de unidades.
- Convertir gramos a mililitros requiere un dato específico del ingrediente; no asumir equivalencia.
- Cantidad comprada y rendimiento deben ser mayores que cero.
- Rechazar cantidades y precios negativos; definir cómo distinguir un precio cero válido de un dato faltante.
- No convertir números inválidos o campos vacíos silenciosamente en costos cero.
- Usar el rendimiento vendible: los recortes descartados no deben contarse como producto vendido.
- Definir precisión y redondeo; distinguir el precio calculado del precio comercial finalmente elegido.
- Mostrar pérdidas si el precio elegido no alcanza a cubrir los costos contemplados.

## Decisiones pendientes

| Tema | Qué falta decidir |
|---|---|
| Plataforma y herramientas | Confirmar la propuesta web y explicar cada tecnología antes de preparar el proyecto |
| Moneda | Propuesta inicial: pesos argentinos; confirmar cómo mostrar moneda y decimales |
| Nuevas compras | Cómo actualizar costos cuando cambia el precio de un insumo y qué conservar de cálculos anteriores |
| Energía | Método sencillo y explícito para estimar el costo de horno y hornallas |
| Trabajo | Tarifa general y horas por receta implementadas; falta definir la regla personal para atribuir tiempos |
| Gastos generales | Cómo repartirlos sin duplicar gastos ya incluidos |
| Venta | Cómo representar envases, comisiones y otros gastos por presentación o canal cuando correspondan |
| Almacenamiento | MongoDB local integrado para insumos, recetas y configuración; quedan presupuestos y estrategia de respaldo |
| Redondeo | Precisión de cálculo y tratamiento del precio elegido para vender |

## Posibles ampliaciones

Cuentas de otros emprendedores, sincronización entre dispositivos, stock, pedidos, ventas, reportes e historial de compras. Se evaluarán después de completar el recorrido principal.

## Referencias investigadas

Consultadas durante la conversación de investigación; no son dependencias ni servicios elegidos para la aplicación. Algunas ofrecen funciones pagas y la calculadora pública tiene un alcance más limitado que los requisitos de este proyecto.

- [CakeCost](https://www.cakecost.net/pages/how-it-works): referencia de costo proporcional de ingredientes.
- [Calculadora pública de Craftybase](https://craftybase.com/cake-pricing-calculator): referencia de desglose y simulación; en la versión revisada utiliza rendimiento por unidades.
- [CakeBoss](https://cakeboss.com/): referencia de costos de recetas y gestión de pedidos.
- [Guía del INTI sobre unidades de producción de alimentos](https://app.inti.gob.ar/greenstone3/library/collection/works/document/Cuad_Mermeladas-2_pdf): referencia conceptual de costos y mercado; publicación de 2009, sus importes no sirven como precios actuales.

Estas referencias aportan ideas. La aplicación debe contemplar expresamente el cálculo y la venta por peso.
