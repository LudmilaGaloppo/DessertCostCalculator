// Unión de literales: solo estas unidades son válidas en el modelo.
export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'unit';

// Datos que se envían al guardar un insumo; el servidor asigna su identificador.
export interface SupplyInput {
  name: string;
  purchaseQuantity: number;
  purchaseUnit: Unit;
  purchasePrice: number;
}

// Insumo guardado del catálogo, con sus datos de compra y su identificador.
export interface Supply extends SupplyInput {
  id: string;
}

// Uso de un insumo dentro de una receta.
export interface RecipeIngredient {
  supplyId: string;
  quantity: number;
  unit: Unit;
}

// Parte de la receta necesaria para el cálculo de ingredientes actual.
export interface Recipe {
  id: string;
  name: string;
  ingredients: readonly RecipeIngredient[];
}

export interface IngredientCost extends RecipeIngredient {
  name: string;
  cost: number;
}

export interface RecipeIngredientsCost {
  items: IngredientCost[];
  ingredientsSubtotal: number;
}
