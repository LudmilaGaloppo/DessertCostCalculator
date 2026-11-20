# Recetas persistidas

La aplicación ya permite armar una receta con varios insumos del catálogo, indicar el rendimiento de una tanda y guardar la receta en MongoDB.

## Qué se guarda

Una receta persiste:

- nombre;
- `yieldQuantity` y `yieldUnit`;
- identificador del insumo, cantidad utilizada y unidad para cada ingrediente.

No guarda el nombre ni el precio del insumo dentro de la receta. El identificador conecta la receta con el catálogo. Al calcular, el frontend vuelve a consultar los insumos y usa sus precios actuales. Así se puede actualizar una compra una sola vez y recalcular todas las recetas relacionadas.

## Formulario dinámico

`useFieldArray` es una herramienta de React Hook Form para administrar una lista de campos. En este caso, cada elemento representa una fila de ingrediente. Permite agregar y quitar filas y conserva un identificador interno estable para que React no confunda sus valores.

Ese identificador interno pertenece al formulario. `supplyId`, en cambio, identifica el insumo guardado en MongoDB.

## Recorrido de los datos

1. La pantalla obtiene insumos y recetas desde la API.
2. El formulario convierte los textos decimales a números.
3. La lógica de dominio comprueba referencias y unidades y calcula el desglose.
4. Al guardar, la API vuelve a validar todo contra el catálogo.
5. MongoDB persiste la receta en la colección `recipes`.

Las rutas incorporadas son:

- `GET /api/recipes`
- `POST /api/recipes`
- `PUT /api/recipes/:id`

El subtotal mostrado incluye solamente ingredientes. Mano de obra, energía, envases y precio de venta pertenecen al próximo bloque.

## Cómo probarlo

Con MongoDB activo, abrir dos terminales desde la raíz:

```powershell
npm run dev:api
```

```powershell
npm run dev
```

Primero se guardan las compras en **Insumos**. Luego, en **Recetas**, se crea la tanda, se agregan ingredientes y se calcula o guarda. Para comprobar el precio vigente, se puede modificar un insumo, volver a la receta y calcular otra vez.
