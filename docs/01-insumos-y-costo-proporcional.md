# Primer ejercicio: insumos y costo proporcional

Estado: ejercicio proporcional cerrado con una corrección numérica el 10/11/2026. Propuesta posterior de modelos de insumo y receta recibida y revisada; ajustes pendientes. Ver [la devolución del modelo](02-modelo-de-datos.md). Las propuestas originales se conservan más abajo.

## Qué vamos a aprender

Elegir qué datos necesita la aplicación y traducir una situación cotidiana a una regla de cálculo. No hace falta escribir código todavía.

## Situación

Datos hipotéticos para practicar:

- Comprás una bolsa de 2,5 kg de harina por $6.000.
- Para una receta utilizás 375 g.
- Otra receta utiliza 150 g de la misma harina.

El precio corresponde a toda la bolsa. Por ahora el ejercicio calcula solamente el costo de harina utilizada; gas, trabajo y otros ingredientes se incorporan después.

## Tu intento

Podés responder acá o en el chat. Una explicación cotidiana alcanza.

1. ¿Qué datos guardarías de esa bolsa para poder reutilizarlos en distintas recetas?
Creo que debería guardar la fecha de su compra, su precio, la cantidad de la bolsa(en k o gramos, da igual, despues se hace la conversion), el nombre y un id para poder asociar el producto y su uso en distintas recetas.
2. ¿Qué dato cambia cuando seleccionás esa harina en cada receta?
la cantidad de la bolsa que queda por usar, ej. compro 1 kilo pero despues uso 500 gr en 2 recetas. Ya no tengo más! Y el precio de la harina segun los gr, no es lo msimo usar 500 gr a 200gr, el precio de costo de insumo va a cambiar.
3. ¿Cuánto cuesta la harina utilizada en cada una de las dos recetas? Mostrá cómo lo calculaste.
Con regla de 3:
                2500 gr ---- $6000
      375 gr (o 150 gr) ---- $X = $ ?
O sea, multiplicando lo diagonal y luego diviendolo por el valor al costado conocido: 375(o 150 segun el calculo que se quiera hacer) x 6000 / 2500.
4. Si alguien carga que compró 0 kg, ¿qué debería hacer la aplicación y por qué?
No se puede hacer nada con 0 kg, deberia arrojar un error de que se introduzca un valor válido para poder concretarse el registro de compra dle producto.

## Respuestas de Ludmila

Las respuestas originales están escritas debajo de cada pregunta en «Tu intento» y se conservan sin modificaciones. La devolución siguiente corresponde a la revisión del asistente.

## Primera devolución — 10/11/2026

Esta devolución corresponde a la primera lectura. La revisión de las respuestas agregadas después se encuentra en «Segunda devolución».

### 1. Datos de la compra

Identificaste nombre, identificador, cantidad y precio, que permiten asociar el insumo con las recetas y calcular su costo. La fecha de compra también es útil para conocer cuándo se registró ese precio y, más adelante, distinguir compras.

Un ajuste: necesitamos guardar explícitamente la unidad junto con la cantidad. El número `2,5` por sí solo no indica si hablamos de kg, g o litros. Podemos aceptar kg o g para harina si convertimos a la misma unidad antes del cálculo.

### 2. Datos de la receta y existencias

Reconociste que utilizar cantidades diferentes produce costos diferentes. El dato que ingresamos en cada receta es la cantidad utilizada, con su unidad; el costo de esa cantidad se calcula a partir de los datos de compra.

Tu observación sobre la harina que queda introduce otra función: control de existencias o stock. Es una necesidad posible que conviene registrar, con alcance todavía pendiente de confirmar.

Guardar una receta describe cómo preparar un producto. Para descontar existencias tendríamos que registrar que efectivamente se elaboró y cuántas veces: una receta guardada puede prepararse muchas veces o no haberse preparado todavía. También habría que contemplar nuevas compras. Por ahora seguimos trabajando en el cálculo de costos.

### 3. Regla de tres

Convertiste correctamente 2,5 kg a 2.500 g y planteaste bien la proporción. Falta completar el despeje y los resultados; todavía no se comprobaron tus cálculos numéricos.

La pista para completar tu planteo es:

```text
X = cantidad utilizada en gramos × precio de compra ÷ cantidad comprada en gramos

Primera receta: X = 375 × 6.000 ÷ 2.500
Segunda receta: X = 150 × 6.000 ÷ 2.500
```

Como se calcula con la misma compra, la receta que utiliza más harina debe tener un costo de harina mayor.

### 4. Cantidad comprada igual a cero

Es correcto impedir el registro y pedir una cantidad válida. El motivo para el cálculo es que la cantidad comprada aparece como divisor: con cero no podemos obtener un costo por gramo.

Una regla concreta para la futura aplicación: la cantidad comprada debe ser mayor que cero. Un mensaje posible es «Ingresá una cantidad comprada mayor que cero».

## Para cerrar este ejercicio

Podés responder acá o en el chat:

1. Completá los dos importes de la pregunta 3 y contá cómo los calculaste.
Primera receta: $900 (resultado del calculo de la linea 64)
Segunda receta: $369 (resultado del calculo de la linea 65)

2. Si guardás una receta que utiliza 375 g de harina, pero todavía no la cocinaste, ¿debería bajar tu stock? Explicá por qué.
No, porque todavía no la cociné y por ende no usé ess gr de harina, debería haber una propiedad que tenga en true/false si se cocinó o no, ej: isCooked: boolean. 

La solicitud anterior se conserva como parte del intercambio. El estado actualizado está en la segunda devolución.

## Segunda devolución — 10/11/2026

### Cálculos

La explicación que agregaste sobre multiplicar y dividir corresponde al despeje correcto de la regla de tres. El primer resultado, $900, es correcto. En el segundo hay una diferencia numérica: el resultado es $360, no $369.

```text
Costo por gramo = 6.000 ÷ 2.500 = $2,40
Primera receta = 375 × 2,40 = $900
Segunda receta = 150 × 2,40 = $360
```

La diferencia del segundo importe no cambia que hayas identificado el procedimiento correcto. Tus respuestas se mantienen tal como las escribiste; esta corrección está registrada por separado.

### Receta, elaboración y stock

Es correcta tu explicación: guardar una receta sin cocinarla no consume harina. Con esa respuesta queda comprobada esta distinción para el ejemplo.

Tu propuesta `isCooked: boolean` muestra una forma de representar dos estados: cocinada o no cocinada. Un booleano es un valor que puede ser `true` o `false`.

Para un registro que solo deba distinguir esos dos estados puede servir. En una receta reutilizable, por sí solo no informa si la preparaste una vez o tres, en qué fechas ni cuántas tandas hiciste. Si más adelante incorporamos stock, convendrá tener registros de elaboración vinculados a la receta: cada registro indicará qué se preparó y en qué cantidad. Esa ampliación sigue pendiente de alcance.

Ejemplo conceptual:

- Receta de brownie: necesita 375 g de harina por tanda.
- Elaboración del lunes: una tanda → consume 375 g.
- Elaboración del viernes: dos tandas → consume 750 g.

### Cierre y siguiente paso

Se da por cerrado este ejercicio con la corrección numérica indicada. Hay evidencia en tus respuestas de que identificás los datos de compra, planteás el costo proporcional, reconocés la cantidad cero como inválida y distinguís guardar una receta de elaborarla. Esto no implica haber evaluado todos los casos posibles de unidades y validación.

El siguiente paso será organizar un primer modelo de datos: qué guardamos del insumo y qué guardamos cuando lo usamos en una receta. Los resultados que pueden calcularse se distinguirán de los datos ingresados. Después explicaremos las herramientas y traduciremos ese modelo a código.

## Mi propuesta de modelo de datos para un insumo
| Campo | Para qué sirve | Ejemplo de valor |
|-------|----------------|------------------|
|InputName| Para saber a que nos estamos refiriendo| "Harina 0000 el molino"|
|UnitOfMeasurement|Para saber en que medida se expresa la cantidad del insumo, si en gr, kilos o unidades |Unitys, grames, kilograms, milliliters, liters, etc |
|Amount| Para saber cuanto tiene en total ese insumo| 1, 200, 3, 4000, etc|
|Price| Para saber cuanto costó el total del insumo, se asume en pesos argentinos|  $2000, $5000|
|Id| Unico e inigualable, para identificar y referenciar este producto en las recetas| abc123

## Mi propuesta de modelo de datos para una receta
| Campo | Para qué sirve | Ejemplo de valor |
|-------|----------------|------------------|
|RecipeName|Para saber a que receta nos estamos refiriendo|"Brownies", "Cookies con chips", etc.|
|Ingredients|Para saber los ingredientes que tiene(y sus cantidades)|Harina, huevos, polvo para hornear, bicarbonato de sodio, azucar, etc -> estaría bueno que sea un array de objetos, para que cada objeto sea un ingrediente, que cada ingrediente tenga 4 propiedades: id de referencia(al insumo), cantidad(usada en la receta): 375, unidad de medida(para indicar en que medida está la cantidad, si en gramos o kilos), y name(distinto al inputName, porque acá puedo poner "Harina" y el inputName del insumo puede dar mas informacion)
|ProductionCost| Para saber cuanto me salió a mi hacer la receta en total, sumando todos los Price de los Insumos (en pesos argentinos) adaptando dichos precios a la cantidad utilizada para la receta en cuestión. Sería un calculo que sumaria todos los price pero adaptados a la cantidad que se usó paral a receta unicamente.| $12000
|WorkingHours|Para saber cuantas horas de trabajo me llevó hacer esa receta y posteriormente sumarlas poniendole un precio al SaleCost| 3|
|YieldQuantity| Cantidad de producto vendible que rinde una tanda de la receta, expresada en YieldUnit. No representa el stock actual ni la cantidad de cada presentación de venta.| 600|
|YieldUnit| Unidad en la que se expresa YieldQuantity; la cantidad se guarda por separado como número.| g, kg, unit|
|GasHours| Para saber cuantas horas de gas gasté en hacer la receta, se le deberia agregar un valor a cada hora segun la ganancia que se busque obtener para poder obtener el SaleCost final| 5
|Packaging|Para saber si tiene packaging que acompañe al producto que se va a vender y cual es su costo para sumarselo al ProductionCost| Podria ser un objeto {type: box,
price: $100(pesos argentinos)}
|Id| Unico e inigualable, para identificar y referenciar esta receta| abc1234

No incluyo el SaleCost porque la idea es que se generer en el momento y no quede guardado dicho valor, al igual que el costo de las horas de gas y de trabajo, no estoy segura de como deberiamos calcularlas pero con un % de ganancia creo que estaría bien. Habría que investigar al respecto


## Pistas opcionales

- Para comparar cantidades, primero expresalas en la misma unidad.
- Podés averiguar cuánto cuesta un gramo y después calcular el costo de la cantidad utilizada.
- El precio de compra pertenece al insumo; la cantidad utilizada depende de la receta.

## Cómo vamos a revisarlo

Comprobaremos que los costos guardan proporción con la cantidad usada, que las unidades son compatibles y que se evita dividir por cero. También distinguiremos los datos que guardamos de los resultados que podemos calcular.

Después traduciremos esta regla a una función pequeña y explicaremos cómo conectarla con una pantalla.
