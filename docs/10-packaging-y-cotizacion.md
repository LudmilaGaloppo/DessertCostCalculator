# Packaging y costo de una cotización

La aplicación ya tiene un catálogo de envases y una pantalla para calcular el costo de una cantidad de cookies. Los envases se guardan en MongoDB con sus datos de compra y capacidad; los stickers se configuran una sola vez porque se comparten entre bolsas y cajas.

## Datos iniciales registrados

| Elemento | Compra | Costo unitario | Capacidad | Stickers |
|---|---:|---:|---:|---:|
| Caja con visor 25 × 20 × 8 cm | 4 por $4.800 | $1.200 | Hasta 12 cookies | 1 |
| Bolsa de polipropileno 12 × 25 | 100 por $1.700 | $17 | 1 cookie | 1 |
| Sticker | 80 por $28.000 | $350 | — | — |

El sticker se mantiene separado del envase. Si cambia el precio de la plancha, se actualiza una sola compra y todas las cotizaciones vuelven a calcularlo.

## Reglas actuales

- Venta individual: una bolsa y un sticker por cookie.
- Venta en caja: una caja y un sticker para cualquier cantidad entre 1 y 12 cookies.
- Si se solicitan más de 12 cookies con esta caja, se rechaza la cotización. La aplicación no agrega varias cajas automáticamente.
- La capacidad se expresa en `unit` porque actualmente se venden cookies por unidad.

```text
Costo unitario del envase = precio de compra ÷ cantidad comprada
Costo unitario del sticker = precio de la plancha ÷ cantidad de stickers

Costo de los productos = costo parcial de una cookie × cantidad solicitada
Costo de packaging = envases necesarios + stickers necesarios
Costo cotizado = productos + packaging
```

Para la caja, el packaging actual cuesta $1.550: $1.200 de caja más $350 de sticker. Para una cookie individual cuesta $367: $17 de bolsa más $350 de sticker.

## Alcance del resultado

El desglose muestra el costo e incluye la [energía estimada de la receta](11-energia-estimada.md). Debajo permite [simular precios de venta](12-precio-de-venta.md) por porcentaje o evaluar un precio manual. Si faltan horas, tarifas, tiempos, promedios diarios o precio de stickers, conserva los importes conocidos, marca el costo como parcial y los precios y ganancias como provisorios.

Las nuevas rutas son:

- `GET`, `POST` y `PUT /api/packaging`
- `GET` y `PUT /api/settings/stickers`

Los datos de caja, bolsa y stickers acordados fueron guardados en la base MongoDB local de desarrollo.
