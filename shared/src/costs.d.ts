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

// Datos editables: el rendimiento describe lo que produce una tanda.
export interface RecipeInput {
  name: string;
  yieldQuantity: number;
  yieldUnit: Unit;
  ingredients: readonly RecipeIngredient[];
}

// Receta persistida; sus costos se calculan con el catálogo vigente.
export interface Recipe extends RecipeInput {
  id: string;
}

export interface IngredientCost extends RecipeIngredient {
  name: string;
  cost: number;
}

export interface RecipeIngredientsCost {
  items: IngredientCost[];
  ingredientsSubtotal: number;
}
