# Mano de obra y costo parcial de producción

La receta ahora puede guardar `workingHours`, el tiempo de trabajo atribuible a una tanda. El valor monetario de una hora se configura una sola vez y se guarda en MongoDB para reutilizarlo en todas las recetas.

```text
Costo de mano de obra = horas de trabajo de la receta × valor general de la hora

Subtotal de producción contemplado = ingredientes + mano de obra conocida
```

## Por qué son datos separados

Las horas describen una receta. La tarifa describe cómo Ludmila valora su tiempo en este momento. Si cambia la tarifa, no hace falta editar todas las recetas: al volver a calcular se utiliza el valor general vigente.

La receta no guarda el costo de mano de obra resultante. Guarda la entrada necesaria para volver a calcularlo. Un presupuesto histórico requerirá guardar una instantánea de los importes utilizados; eso sigue pendiente.

## Un dato pendiente no vale cero

`workingHours` y `hourlyRate` pueden estar sin configurar. La interfaz muestra la mano de obra como **Pendiente** y aclara que el subtotal es parcial. Esto evita afirmar que el trabajo no tuvo costo solamente porque todavía no se cargó un dato.

La API representa la ausencia mediante `null`. Un cero explícito de horas sí puede representar una receta sin tiempo atribuible; la tarifa debe ser mayor que cero.

## Persistencia y rutas

La tarifa general se guarda en la colección `settings`, separada de `recipes`:

- `GET /api/settings/costs`
- `PUT /api/settings/costs`

La receta conserva `workingHours` junto con su rendimiento e ingredientes. El frontend vuelve a consultar catálogo y configuración antes de calcular.

## Límite actual

El resultado incluye ingredientes, mano de obra y la [estimación sencilla de energía](11-energia-estimada.md) cuando sus entradas están disponibles. El packaging se suma al cotizar la venta. El valor mostrado no es un precio de venta.
