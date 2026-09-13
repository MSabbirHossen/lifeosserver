/**
 * Curated Everyday Nutritional Database
 * Verified nutritional values for staple proteins, carbs, fats, vegetables, fruits,
 * Ramadan foods (Sahri & Iftar), and common beverages per 100g and per piece.
 */

export const CURATED_FOODS = [
  // --- PROTEINS & POULTRY & MEAT ---
  { name: 'Chicken Breast (Cooked, Skinless)', category: 'Protein', unit: 'gram', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, pieceWeightG: 150 },
  { name: 'Chicken Thigh (Cooked)', category: 'Protein', unit: 'gram', caloriesPer100g: 209, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11, pieceWeightG: 100 },
  { name: 'Boiled Egg', category: 'Protein', unit: 'piece', caloriesPerPiece: 78, proteinPerPiece: 6.3, carbsPerPiece: 0.6, fatPerPiece: 5.3, caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { name: 'Egg White (Boiled)', category: 'Protein', unit: 'piece', caloriesPerPiece: 17, proteinPerPiece: 3.6, carbsPerPiece: 0.2, fatPerPiece: 0.1, caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
  { name: 'Salmon Fillet (Grilled)', category: 'Protein', unit: 'gram', caloriesPer100g: 208, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 13, pieceWeightG: 150 },
  { name: 'Tuna Canned in Water', category: 'Protein', unit: 'gram', caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1.0, pieceWeightG: 120 },
  { name: 'Lean Beef Steak (Cooked)', category: 'Protein', unit: 'gram', caloriesPer100g: 217, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 12, pieceWeightG: 180 },
  { name: 'Ground Beef (90/10 Lean)', category: 'Protein', unit: 'gram', caloriesPer100g: 176, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 10 },
  { name: 'Whey Protein Scoop', category: 'Protein', unit: 'piece', caloriesPerPiece: 120, proteinPerPiece: 24, carbsPerPiece: 2.5, fatPerPiece: 1.5, pieceWeightG: 30 },
  { name: 'Greek Yogurt (Plain, Non-fat)', category: 'Dairy', unit: 'gram', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { name: 'Cottage Cheese (Low-fat)', category: 'Dairy', unit: 'gram', caloriesPer100g: 82, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 2.3 },
  { name: 'Tofu (Firm)', category: 'Protein', unit: 'gram', caloriesPer100g: 83, proteinPer100g: 10, carbsPer100g: 2.0, fatPer100g: 5.0 },

  // --- CARBS & STAPLES ---
  { name: 'White Rice (Cooked)', category: 'Carbohydrate', unit: 'gram', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { name: 'Brown Rice (Cooked)', category: 'Carbohydrate', unit: 'gram', caloriesPer100g: 112, proteinPer100g: 2.6, carbsPer100g: 24, fatPer100g: 0.9 },
  { name: 'Rolled Oats (Raw)', category: 'Carbohydrate', unit: 'gram', caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66, fatPer100g: 6.9 },
  { name: 'Oatmeal (Cooked with water)', category: 'Carbohydrate', unit: 'gram', caloriesPer100g: 71, proteinPer100g: 2.5, carbsPer100g: 12, fatPer100g: 1.5 },
  { name: 'Sweet Potato (Baked)', category: 'Carbohydrate', unit: 'gram', caloriesPer100g: 90, proteinPer100g: 2.0, carbsPer100g: 21, fatPer100g: 0.1, pieceWeightG: 180 },
  { name: 'Boiled Potato', category: 'Carbohydrate', unit: 'gram', caloriesPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1, pieceWeightG: 150 },
  { name: 'Whole Wheat Roti / Chapati', category: 'Carbohydrate', unit: 'piece', caloriesPerPiece: 104, proteinPerPiece: 3.5, carbsPerPiece: 20, fatPerPiece: 1.2, pieceWeightG: 45 },
  { name: 'Whole Grain Bread Slice', category: 'Carbohydrate', unit: 'piece', caloriesPerPiece: 80, proteinPerPiece: 4.0, carbsPerPiece: 14, fatPerPiece: 1.0, pieceWeightG: 35 },
  { name: 'Pasta (Cooked)', category: 'Carbohydrate', unit: 'gram', caloriesPer100g: 158, proteinPer100g: 5.8, carbsPer100g: 31, fatPer100g: 0.9 },
  { name: 'Quinoa (Cooked)', category: 'Carbohydrate', unit: 'gram', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9 },

  // --- FRUITS & DATES ---
  { name: 'Banana', category: 'Fruit', unit: 'piece', caloriesPerPiece: 105, proteinPerPiece: 1.3, carbsPerPiece: 27, fatPerPiece: 0.3, pieceWeightG: 120, caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { name: 'Apple (Medium)', category: 'Fruit', unit: 'piece', caloriesPerPiece: 95, proteinPerPiece: 0.5, carbsPerPiece: 25, fatPerPiece: 0.3, pieceWeightG: 180, caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { name: 'Medjool Date', category: 'Fruit', unit: 'piece', caloriesPerPiece: 66, proteinPerPiece: 0.4, carbsPerPiece: 18, fatPerPiece: 0.0, pieceWeightG: 24, caloriesPer100g: 277, proteinPer100g: 1.8, carbsPer100g: 75, fatPer100g: 0.2 },
  { name: 'Orange', category: 'Fruit', unit: 'piece', caloriesPerPiece: 62, proteinPerPiece: 1.2, carbsPerPiece: 15, fatPerPiece: 0.2, pieceWeightG: 130 },
  { name: 'Blueberries', category: 'Fruit', unit: 'gram', caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3 },
  { name: 'Strawberries', category: 'Fruit', unit: 'gram', caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3 },
  { name: 'Watermelon Slice', category: 'Fruit', unit: 'gram', caloriesPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 7.6, fatPer100g: 0.2, pieceWeightG: 280 },

  // --- HEALTHY FATS & OILS ---
  { name: 'Olive Oil', category: 'Fat', unit: 'tablespoon', caloriesPerPiece: 119, proteinPerPiece: 0, carbsPerPiece: 0, fatPerPiece: 13.5, caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { name: 'Almonds (Raw)', category: 'Fat', unit: 'gram', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, pieceWeightG: 30 },
  { name: 'Walnuts', category: 'Fat', unit: 'gram', caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65, pieceWeightG: 30 },
  { name: 'Peanut Butter (Natural)', category: 'Fat', unit: 'tablespoon', caloriesPerPiece: 95, proteinPerPiece: 4.0, carbsPerPiece: 3.5, fatPerPiece: 8.0, caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
  { name: 'Avocado', category: 'Fat', unit: 'piece', caloriesPerPiece: 240, proteinPerPiece: 3.0, carbsPerPiece: 12, fatPerPiece: 22, pieceWeightG: 150, caloriesPer100g: 160, proteinPer100g: 2.0, carbsPer100g: 8.5, fatPer100g: 15 },

  // --- RAMADAN & SPECIAL FOODS ---
  { name: 'Piaju (Lentil Fritter)', category: 'Ramadan Snack', unit: 'piece', caloriesPerPiece: 75, proteinPerPiece: 2.2, carbsPerPiece: 7.5, fatPerPiece: 4.2 },
  { name: 'Beguni (Eggplant Fritter)', category: 'Ramadan Snack', unit: 'piece', caloriesPerPiece: 85, proteinPerPiece: 1.5, carbsPerPiece: 9.0, fatPerPiece: 5.0 },
  { name: 'Chola Bhuna (Chickpea Curry)', category: 'Ramadan Snack', unit: 'gram', caloriesPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27, fatPer100g: 2.6 },
  { name: 'Haleem (Mixed Meat & Lentils)', category: 'Meal', unit: 'bowl', caloriesPerPiece: 350, proteinPerPiece: 22, carbsPerPiece: 38, fatPerPiece: 12, caloriesPer100g: 140, proteinPer100g: 8.8, carbsPer100g: 15, fatPer100g: 4.8 },
  { name: 'Rooh Afza with Water', category: 'Beverage', unit: 'cup', caloriesPerPiece: 90, proteinPerPiece: 0, carbsPerPiece: 23, fatPerPiece: 0 },
  { name: 'Milk (Whole, Cow)', category: 'Dairy', unit: 'ml', caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3 },
];

/**
 * Standardized calorie and macro calculation for any food portion size.
 * Handles grams/ml (per 100g baseline) and piece/serving (per piece baseline).
 */
export const calculateFoodNutrients = ({
  foodItem,
  name,
  quantity = 1,
  unit = 'gram',
  caloriesPerUnit,
  proteinPerUnit,
  carbsPerUnit,
  fatPerUnit,
  caloriesPer100g,
  proteinPer100g,
  carbsPer100g,
  fatPer100g,
  caloriesPerPiece,
  proteinPerPiece,
  carbsPerPiece,
  fatPerPiece,
  customCalories,
  customProtein,
  customCarbs,
  customFat,
}) => {
  const qty = Math.max(0, Number(quantity) || 0);

  // If user entered custom total calories directly
  if (customCalories !== undefined && Number(customCalories) > 0) {
    return {
      calories: Math.round(Number(customCalories) * 10) / 10,
      protein: Math.round((Number(customProtein) || 0) * 10) / 10,
      carbs: Math.round((Number(customCarbs) || 0) * 10) / 10,
      fat: Math.round((Number(customFat) || 0) * 10) / 10,
    };
  }

  const isGramOrMl = unit === 'gram' || unit === 'g' || unit === 'ml';

  if (isGramOrMl) {
    const calPer100 =
      caloriesPer100g !== undefined
        ? Number(caloriesPer100g)
        : foodItem?.caloriesPer100g !== undefined
        ? Number(foodItem.caloriesPer100g)
        : caloriesPerUnit !== undefined
        ? Number(caloriesPerUnit)
        : foodItem?.caloriesPerUnit !== undefined
        ? Number(foodItem.caloriesPerUnit)
        : 100;

    const pPer100 =
      proteinPer100g !== undefined
        ? Number(proteinPer100g)
        : foodItem?.proteinPer100g !== undefined
        ? Number(foodItem.proteinPer100g)
        : proteinPerUnit !== undefined
        ? Number(proteinPerUnit)
        : foodItem?.proteinPerUnit !== undefined
        ? Number(foodItem.proteinPerUnit)
        : 0;

    const cPer100 =
      carbsPer100g !== undefined
        ? Number(carbsPer100g)
        : foodItem?.carbsPer100g !== undefined
        ? Number(foodItem.carbsPer100g)
        : carbsPerUnit !== undefined
        ? Number(carbsPerUnit)
        : foodItem?.carbsPerUnit !== undefined
        ? Number(foodItem.carbsPerUnit)
        : 0;

    const fPer100 =
      fatPer100g !== undefined
        ? Number(fatPer100g)
        : foodItem?.fatPer100g !== undefined
        ? Number(foodItem.fatPer100g)
        : fatPerUnit !== undefined
        ? Number(fatPerUnit)
        : foodItem?.fatPerUnit !== undefined
        ? Number(foodItem.fatPerUnit)
        : 0;

    return {
      calories: Math.round((calPer100 / 100) * qty * 10) / 10,
      protein: Math.round((pPer100 / 100) * qty * 10) / 10,
      carbs: Math.round((cPer100 / 100) * qty * 10) / 10,
      fat: Math.round((fPer100 / 100) * qty * 10) / 10,
    };
  }

  // Piece or serving based
  const calPerPiece =
    caloriesPerPiece !== undefined
      ? Number(caloriesPerPiece)
      : foodItem?.caloriesPerPiece !== undefined
      ? Number(foodItem.caloriesPerPiece)
      : caloriesPerUnit !== undefined
      ? Number(caloriesPerUnit)
      : foodItem?.caloriesPerUnit !== undefined
      ? Number(foodItem.caloriesPerUnit)
      : 100;

  const pPerPiece =
    proteinPerPiece !== undefined
      ? Number(proteinPerPiece)
      : foodItem?.proteinPerPiece !== undefined
      ? Number(foodItem.proteinPerPiece)
      : proteinPerUnit !== undefined
      ? Number(proteinPerUnit)
      : foodItem?.proteinPerUnit !== undefined
      ? Number(foodItem.proteinPerUnit)
      : 5;

  const cPerPiece =
    carbsPerPiece !== undefined
      ? Number(carbsPerPiece)
      : foodItem?.carbsPerPiece !== undefined
      ? Number(foodItem.carbsPerPiece)
      : carbsPerUnit !== undefined
      ? Number(carbsPerUnit)
      : foodItem?.carbsPerUnit !== undefined
      ? Number(foodItem.carbsPerUnit)
      : 10;

  const fPerPiece =
    fatPerPiece !== undefined
      ? Number(fatPerPiece)
      : foodItem?.fatPerPiece !== undefined
      ? Number(foodItem.fatPerPiece)
      : fatPerUnit !== undefined
      ? Number(fatPerUnit)
      : foodItem?.fatPerUnit !== undefined
      ? Number(foodItem.fatPerUnit)
      : 2;

  return {
    calories: Math.round(calPerPiece * qty * 10) / 10,
    protein: Math.round(pPerPiece * qty * 10) / 10,
    carbs: Math.round(cPerPiece * qty * 10) / 10,
    fat: Math.round(fPerPiece * qty * 10) / 10,
  };
};
