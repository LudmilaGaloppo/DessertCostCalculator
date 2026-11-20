# Energía estimada por receta

La aplicación incorpora una estimación sencilla de gas y electricidad sin exigir potencia en watts, consumo en kWh ni consumo técnico del horno.

## Datos generales actuales

- Promedio diario de gas de red: $3.000.
- Promedio diario de electricidad: $2.850.

Estos valores se guardan en MongoDB y se pueden actualizar cuando cambie la factura. No se guardan dentro de cada receta.

## Datos de cada receta

Cada receta guarda por separado:

- minutos de horno a gas, incluyendo precalentado;
- minutos de batidora eléctrica, sumando los distintos intervalos de mezcla.

Para la receta de cookies se estimaron 90 minutos de horno y 5 minutos de batidora. Como todavía no hay una receta guardada en la base local, esos tiempos deberán cargarse al crearla; no se aplican automáticamente a otras recetas.

## Prorrateo elegido

```text
Costo estimado = promedio diario ÷ 24 × minutos utilizados ÷ 60
```

Con los datos actuales:

```text
Gas = $3.000 ÷ 24 × 90 ÷ 60 = $187,50
Electricidad = $2.850 ÷ 24 × 5 ÷ 60 = $9,90 aproximadamente
Energía estimada de la tanda = $197,40 aproximadamente
```

Este método reparte el costo promedio del hogar de forma uniforme durante el día. Es una aproximación deliberadamente simple: incluye consumos y cargos que no pertenecen exclusivamente al horno o a la batidora y no representa una medición técnica de los artefactos.

La ventaja es que resulta fácil de mantener. Si más adelante se busca mayor precisión, se puede reemplazar por consumo de gas por hora y potencia eléctrica sin cambiar los tiempos guardados en las recetas.

## Datos pendientes

Si faltan los minutos o los promedios diarios, el resultado conserva los costos conocidos y se marca como parcial. Un tiempo cero explícito significa que esa receta no utiliza ese artefacto; un campo vacío significa que todavía no se informó.

La ruta incorporada es `PUT /api/settings/energy`. La lectura continúa realizándose mediante `GET /api/settings/costs` junto con el valor de la hora.
