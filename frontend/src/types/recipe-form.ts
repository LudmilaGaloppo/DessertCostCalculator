export interface RecipeFormValues {
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  workingHours: string;
  ingredients: { supplyId: string; quantity: string; unit: string }[];
}
