import { Meal } from '../models/Meal.js';
import { Workout } from '../models/Workout.js';
import { WorkoutType } from '../models/WorkoutType.js';
import { BodyMetric } from '../models/BodyMetric.js';
import { WaterLog } from '../models/WaterLog.js';
import { FoodItem } from '../models/FoodItem.js';
import { User } from '../models/User.js';
import { CURATED_EXERCISES, calculateWorkoutCalories } from '../config/workoutDataset.js';
import { CURATED_FOODS, calculateFoodNutrients } from '../config/nutritionDataset.js';

// --- Meals & Nutrition ---

export const getMeals = async (req, res) => {
  try {
    const { date, from, to } = req.query;
    const filter = { userId: req.user._id };

    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const meals = await Meal.find(filter).sort({ createdAt: -1 });
    res.json(meals);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch meals' });
  }
};

export const createMeal = async (req, res) => {
  try {
    const { date, mealType, items } = req.body;
    if (!date || !mealType || !items || !items.length) {
      return res.status(400).json({ message: 'Date, mealType, and at least one item are required' });
    }

    let calculatedTotalCalories = 0;
    let calculatedTotalProtein = 0;
    let calculatedTotalCarbs = 0;
    let calculatedTotalFat = 0;

    const processedItems = await Promise.all(
      items.map(async (item) => {
        const qty = Math.max(0.1, Number(item.quantity) || 1);
        const itemUnit = item.unit || 'piece';
        const isGramOrMl = itemUnit === 'gram' || itemUnit === 'ml';

        let calPerUnit = Number(item.caloriesPerUnit) || 0;
        let pPerUnit = Number(item.proteinPerUnit) || 0;
        let cPerUnit = Number(item.carbsPerUnit) || 0;
        let fPerUnit = Number(item.fatPerUnit) || 0;

        // Auto-upsert or find in FoodItem library
        if (item.name?.trim()) {
          const trimmedName = item.name.trim();
          let foodDoc = await FoodItem.findOne({ userId: req.user._id, name: trimmedName });

          if (calPerUnit > 0) {
            if (foodDoc) {
              foodDoc.caloriesPerUnit = calPerUnit;
              foodDoc.proteinPerUnit = pPerUnit;
              foodDoc.carbsPerUnit = cPerUnit;
              foodDoc.fatPerUnit = fPerUnit;
              foodDoc.unitType = itemUnit;
              foodDoc.timesUsed += 1;
              foodDoc.lastUsedAt = new Date();
              await foodDoc.save();
            } else {
              foodDoc = await FoodItem.create({
                userId: req.user._id,
                name: trimmedName,
                unitType: itemUnit,
                caloriesPerUnit: calPerUnit,
                proteinPerUnit: pPerUnit,
                carbsPerUnit: cPerUnit,
                fatPerUnit: fPerUnit,
              });
            }
          } else if (foodDoc) {
            calPerUnit = foodDoc.caloriesPerUnit;
            pPerUnit = foodDoc.proteinPerUnit || 0;
            cPerUnit = foodDoc.carbsPerUnit || 0;
            fPerUnit = foodDoc.fatPerUnit || 0;
          }
        }

        // Calculate precise calories & macros
        const nutrients = calculateFoodNutrients({
          foodItem: {
            caloriesPer100g: isGramOrMl ? calPerUnit : undefined,
            proteinPer100g: isGramOrMl ? pPerUnit : undefined,
            carbsPer100g: isGramOrMl ? cPerUnit : undefined,
            fatPer100g: isGramOrMl ? fPerUnit : undefined,
            caloriesPerPiece: !isGramOrMl ? calPerUnit : undefined,
            proteinPerPiece: !isGramOrMl ? pPerUnit : undefined,
            carbsPerPiece: !isGramOrMl ? cPerUnit : undefined,
            fatPerPiece: !isGramOrMl ? fPerUnit : undefined,
          },
          quantity: qty,
          unit: itemUnit,
          customCalories: item.calories,
          customProtein: item.protein,
          customCarbs: item.carbs,
          customFat: item.fat,
        });

        calculatedTotalCalories += nutrients.calories;
        calculatedTotalProtein += nutrients.protein;
        calculatedTotalCarbs += nutrients.carbs;
        calculatedTotalFat += nutrients.fat;

        return {
          name: item.name.trim(),
          quantity: qty,
          unit: itemUnit,
          calories: nutrients.calories,
          protein: nutrients.protein,
          carbs: nutrients.carbs,
          fat: nutrients.fat,
        };
      })
    );

    const meal = await Meal.create({
      userId: req.user._id,
      date,
      mealType,
      items: processedItems,
      totalCalories: Math.round(calculatedTotalCalories),
      totalProtein: Math.round(calculatedTotalProtein * 10) / 10,
      totalCarbs: Math.round(calculatedTotalCarbs * 10) / 10,
      totalFat: Math.round(calculatedTotalFat * 10) / 10,
    });

    res.status(201).json(meal);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log meal' });
  }
};

export const updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!meal) return res.status(404).json({ message: 'Meal not found' });

    const { date, mealType, items } = req.body;
    if (date) meal.date = date;
    if (mealType) meal.mealType = mealType;

    if (items && Array.isArray(items) && items.length > 0) {
      let calculatedTotalCalories = 0;
      let calculatedTotalProtein = 0;
      let calculatedTotalCarbs = 0;
      let calculatedTotalFat = 0;

      const processedItems = await Promise.all(
        items.map(async (item) => {
          const itemUnit = item.unit || 'piece';
          const qty = Number(item.quantity) || 1;
          const isGramOrMl = itemUnit === 'gram' || itemUnit === 'ml';

          let calPerUnit = Number(item.caloriesPerUnit) || 0;
          let pPerUnit = Number(item.proteinPerUnit) || 0;
          let cPerUnit = Number(item.carbsPerUnit) || 0;
          let fPerUnit = Number(item.fatPerUnit) || 0;

          if (item.name?.trim()) {
            const trimmedName = item.name.trim();
            let foodDoc = await FoodItem.findOne({ userId: req.user._id, name: trimmedName });

            if (calPerUnit > 0) {
              if (foodDoc) {
                foodDoc.caloriesPerUnit = calPerUnit;
                foodDoc.proteinPerUnit = pPerUnit;
                foodDoc.carbsPerUnit = cPerUnit;
                foodDoc.fatPerUnit = fPerUnit;
                foodDoc.unitType = itemUnit;
                await foodDoc.save();
              }
            } else if (foodDoc) {
              calPerUnit = foodDoc.caloriesPerUnit;
              pPerUnit = foodDoc.proteinPerUnit || 0;
              cPerUnit = foodDoc.carbsPerUnit || 0;
              fPerUnit = foodDoc.fatPerUnit || 0;
            }
          }

          const nutrients = calculateFoodNutrients({
            foodItem: {
              caloriesPer100g: isGramOrMl ? calPerUnit : undefined,
              proteinPer100g: isGramOrMl ? pPerUnit : undefined,
              carbsPer100g: isGramOrMl ? cPerUnit : undefined,
              fatPer100g: isGramOrMl ? fPerUnit : undefined,
              caloriesPerPiece: !isGramOrMl ? calPerUnit : undefined,
              proteinPerPiece: !isGramOrMl ? pPerUnit : undefined,
              carbsPerPiece: !isGramOrMl ? cPerUnit : undefined,
              fatPerPiece: !isGramOrMl ? fPerUnit : undefined,
            },
            quantity: qty,
            unit: itemUnit,
            customCalories: item.calories,
            customProtein: item.protein,
            customCarbs: item.carbs,
            customFat: item.fat,
          });

          calculatedTotalCalories += nutrients.calories;
          calculatedTotalProtein += nutrients.protein;
          calculatedTotalCarbs += nutrients.carbs;
          calculatedTotalFat += nutrients.fat;

          return {
            name: item.name.trim(),
            quantity: qty,
            unit: itemUnit,
            calories: nutrients.calories,
            protein: nutrients.protein,
            carbs: nutrients.carbs,
            fat: nutrients.fat,
          };
        })
      );

      meal.items = processedItems;
      meal.totalCalories = Math.round(calculatedTotalCalories);
      meal.totalProtein = Math.round(calculatedTotalProtein * 10) / 10;
      meal.totalCarbs = Math.round(calculatedTotalCarbs * 10) / 10;
      meal.totalFat = Math.round(calculatedTotalFat * 10) / 10;
    }

    await meal.save();
    res.json(meal);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update meal' });
  }
};

export const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    res.json({ message: 'Meal deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete meal' });
  }
};

// --- Workouts & Exercises ---

export const getWorkouts = async (req, res) => {
  try {
    const { date, from, to } = req.query;
    const filter = { userId: req.user._id };

    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const workouts = await Workout.find(filter).sort({ createdAt: -1 });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch workouts' });
  }
};

export const createWorkout = async (req, res) => {
  try {
    const {
      date,
      name,
      title,
      trackingType,
      sets,
      reps,
      weight,
      durationMinutes,
      caloriesBurned,
      target,
      idealCaloriesPerSet,
      idealCaloriesPerMin,
      notes,
    } = req.body;

    const exerciseName = (name || title || '').trim();
    if (!date || !exerciseName) {
      return res.status(400).json({ message: 'Date and workout name are required' });
    }
    const type = trackingType || (sets > 0 ? 'sets_reps' : 'duration');
    const numSets = Number(sets) || 0;
    const numReps = Number(reps) || 0;
    const numWeight = Number(weight) || 0;
    const numDuration = Number(durationMinutes) || 0;

    // Check or upsert WorkoutType in library
    let workoutTypeDoc = await WorkoutType.findOne({ userId: req.user._id, name: exerciseName });

    if (workoutTypeDoc) {
      if (idealCaloriesPerSet) workoutTypeDoc.caloriesPerSet = Number(idealCaloriesPerSet);
      if (idealCaloriesPerMin) workoutTypeDoc.defaultCaloriesPerMinute = Number(idealCaloriesPerMin);
      if (numSets > 0) workoutTypeDoc.defaultSets = numSets;
      if (numReps > 0) workoutTypeDoc.defaultReps = numReps;
      if (target) workoutTypeDoc.target = target;
      await workoutTypeDoc.save();
    } else {
      workoutTypeDoc = await WorkoutType.create({
        userId: req.user._id,
        name: exerciseName,
        trackingType: type,
        caloriesPerSet: Number(idealCaloriesPerSet) || 8,
        defaultCaloriesPerMinute: Number(idealCaloriesPerMin) || 6,
        defaultSets: numSets || 3,
        defaultReps: numReps || 10,
        defaultWeight: numWeight || 0,
        target: target || 'Muscle',
      });
    }

    // Determine Calories Burned using verified MET and bodyweight
    let finalCalories = Number(caloriesBurned);

    if (!finalCalories || finalCalories <= 0) {
      // Retrieve latest user weight from BodyMetric
      const latestMetric = await BodyMetric.findOne({ userId: req.user._id, weightKg: { $exists: true, $ne: null } }).sort({ date: -1, createdAt: -1 });
      const user = await User.findById(req.user._id);
      const bodyWeightKg = latestMetric?.weightKg || user?.weightGoal || 70;

      const curatedMatch = CURATED_EXERCISES.find(
        (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
      );

      finalCalories = calculateWorkoutCalories({
        exercise: curatedMatch || {
          met: target === 'Cardio' ? 8.5 : target === 'Sports' ? 7.5 : target === 'Flexibility' ? 3.5 : 5.5,
          trackingType: type,
          caloriesPerRep: workoutTypeDoc.caloriesPerRep || 0.8,
          defaultCaloriesPerMinute: workoutTypeDoc.defaultCaloriesPerMinute || 6,
        },
        weightKg: bodyWeightKg,
        durationMinutes: numDuration,
        sets: numSets,
        reps: numReps,
      });
    }

    const workout = await Workout.create({
      userId: req.user._id,
      date,
      workoutTypeId: workoutTypeDoc._id,
      name: exerciseName,
      trackingType: type,
      sets: numSets,
      reps: numReps,
      weight: numWeight,
      durationMinutes: numDuration || (numSets > 0 ? numSets * 3 : 30),
      caloriesBurned: finalCalories || 50,
      target: target || workoutTypeDoc.target || 'Muscle',
      notes: notes?.trim() || '',
    });

    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log workout' });
  }
};

export const updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    const {
      date,
      name,
      title,
      trackingType,
      sets,
      reps,
      weight,
      durationMinutes,
      caloriesBurned,
      target,
      notes,
    } = req.body;

    if (date) workout.date = date;
    const exerciseName = (name || title || workout.name || '').trim();
    if (exerciseName) workout.name = exerciseName;
    if (target) workout.target = target;
    if (trackingType) workout.trackingType = trackingType;
    if (sets !== undefined) workout.sets = Number(sets) || 0;
    if (reps !== undefined) workout.reps = Number(reps) || 0;
    if (weight !== undefined) workout.weight = Number(weight) || 0;
    if (durationMinutes !== undefined) workout.durationMinutes = Number(durationMinutes) || 0;
    if (caloriesBurned !== undefined && Number(caloriesBurned) > 0) {
      workout.caloriesBurned = Number(caloriesBurned);
    }
    if (notes !== undefined) workout.notes = notes.trim();

    await workout.save();
    res.json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update workout' });
  }
};

export const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    res.json({ message: 'Workout deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete workout' });
  }
};

// --- Autocomplete Searches with Curated & Online APIs ---

// Helper for assigning relevant emoji icon to food name
export const getFoodIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('egg') || n.includes('omelet') || n.includes('dim')) return '🥚';
  if (n.includes('chicken') || n.includes('poultry') || n.includes('murgh')) return '🍗';
  if (n.includes('beef') || n.includes('steak') || n.includes('meat') || n.includes('mutton') || n.includes('gosht')) return '🥩';
  if (n.includes('fish') || n.includes('salmon') || n.includes('tuna') || n.includes('shrimp') || n.includes('prawn') || n.includes('mach')) return '🐟';
  if (n.includes('rice') || n.includes('bhat') || n.includes('biryani') || n.includes('khichuri')) return '🍚';
  if (n.includes('oat') || n.includes('porridge') || n.includes('cereal') || n.includes('soup') || n.includes('haleem')) return '🥣';
  if (n.includes('banana') || n.includes('kela')) return '🍌';
  if (n.includes('apple')) return '🍎';
  if (n.includes('avocado')) return '🥑';
  if (n.includes('date') || n.includes('khejur')) return '🌴';
  if (n.includes('bread') || n.includes('roti') || n.includes('chapati') || n.includes('toast') || n.includes('naan') || n.includes('paratha')) return '🍞';
  if (n.includes('milk') || n.includes('yogurt') || n.includes('dahi') || n.includes('curd') || n.includes('shake') || n.includes('whey')) return '🥛';
  if (n.includes('cheese') || n.includes('paneer')) return '🧀';
  if (n.includes('coffee') || n.includes('tea') || n.includes('cha')) return '☕';
  if (n.includes('salad') || n.includes('lettuce') || n.includes('cucumber') || n.includes('spinach') || n.includes('shak') || n.includes('broccoli')) return '🥗';
  if (n.includes('potato') || n.includes('alu') || n.includes('fries')) return '🥔';
  if (n.includes('nut') || n.includes('almond') || n.includes('peanut') || n.includes('walnut') || n.includes('kaju') || n.includes('badam')) return '🥜';
  if (n.includes('pasta') || n.includes('noodle') || n.includes('spaghetti') || n.includes('ramen')) return '🍝';
  if (n.includes('pizza') || n.includes('burger') || n.includes('sandwich')) return '🥪';
  if (n.includes('water') || n.includes('juice') || n.includes('smoothie') || n.includes('rooh')) return '🥤';
  if (n.includes('chola') || n.includes('chickpea') || n.includes('piaju') || n.includes('beguni') || n.includes('dal') || n.includes('lentil')) return '🧆';
  return '🍽️';
};

export const getFrequentFoodItems = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch user's FoodItem records ordered by frequency and recency
    const userFoods = await FoodItem.find({ userId })
      .sort({ timesUsed: -1, lastUsedAt: -1 })
      .limit(10);

    const frequentList = [];
    const seenNames = new Set();

    // Add user saved foods
    for (const f of userFoods) {
      const key = f.name.toLowerCase().trim();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        const unitType = f.unitType || 'piece';
        const isGramOrMl = unitType === 'gram' || unitType === 'ml' || unitType === 'g';
        frequentList.push({
          _id: f._id,
          name: f.name,
          category: 'Personal Library',
          unitType: unitType,
          unit: unitType,
          caloriesPerUnit: f.caloriesPerUnit,
          proteinPerUnit: f.proteinPerUnit || 0,
          carbsPerUnit: f.carbsPerUnit || 0,
          fatPerUnit: f.fatPerUnit || 0,
          caloriesPer100g: isGramOrMl ? f.caloriesPerUnit : undefined,
          proteinPer100g: isGramOrMl ? f.proteinPerUnit : undefined,
          carbsPer100g: isGramOrMl ? f.carbsPerUnit : undefined,
          fatPer100g: isGramOrMl ? f.fatPerUnit : undefined,
          caloriesPerPiece: !isGramOrMl ? f.caloriesPerUnit : undefined,
          proteinPerPiece: !isGramOrMl ? f.proteinPerUnit : undefined,
          carbsPerPiece: !isGramOrMl ? f.carbsPerUnit : undefined,
          fatPerPiece: !isGramOrMl ? f.fatPerUnit : undefined,
          timesUsed: f.timesUsed || 1,
          source: f.timesUsed > 1 ? `Logged ${f.timesUsed}x` : 'Frequent Food',
          icon: getFoodIcon(f.name),
        });
      }
    }

    // 2. If userFoods < 8, scan recent meals to pick up any logged food items
    if (frequentList.length < 8) {
      const recentMeals = await Meal.find({ userId })
        .sort({ createdAt: -1 })
        .limit(25);

      const mealItemCounts = new Map();
      const mealItemDetails = new Map();

      for (const meal of recentMeals) {
        if (Array.isArray(meal.items)) {
          for (const item of meal.items) {
            if (item.name) {
              const nameKey = item.name.toLowerCase().trim();
              mealItemCounts.set(nameKey, (mealItemCounts.get(nameKey) || 0) + 1);
              if (!mealItemDetails.has(nameKey)) {
                mealItemDetails.set(nameKey, item);
              }
            }
          }
        }
      }

      const sortedMealItems = Array.from(mealItemCounts.entries())
        .sort((a, b) => b[1] - a[1]);

      for (const [nameKey, count] of sortedMealItems) {
        if (!seenNames.has(nameKey) && frequentList.length < 8) {
          seenNames.add(nameKey);
          const item = mealItemDetails.get(nameKey);
          const unitType = item.unit || 'piece';
          const qty = Number(item.quantity) || 1;
          const isGramOrMl = unitType === 'gram' || unitType === 'ml' || unitType === 'g';

          const calPerUnit = isGramOrMl
            ? Math.round((Number(item.calories) / qty) * 100)
            : Math.round(Number(item.calories) / qty);
          const pPerUnit = isGramOrMl
            ? Math.round(((Number(item.protein) || 0) / qty) * 100 * 10) / 10
            : Math.round(((Number(item.protein) || 0) / qty) * 10) / 10;
          const cPerUnit = isGramOrMl
            ? Math.round(((Number(item.carbs) || 0) / qty) * 100 * 10) / 10
            : Math.round(((Number(item.carbs) || 0) / qty) * 10) / 10;
          const fPerUnit = isGramOrMl
            ? Math.round(((Number(item.fat) || 0) / qty) * 100 * 10) / 10
            : Math.round(((Number(item.fat) || 0) / qty) * 10) / 10;

          frequentList.push({
            name: item.name,
            category: 'Recent Meals',
            unitType: unitType,
            unit: unitType,
            caloriesPerUnit: calPerUnit,
            proteinPerUnit: pPerUnit,
            carbsPerUnit: cPerUnit,
            fatPerUnit: fPerUnit,
            caloriesPer100g: isGramOrMl ? calPerUnit : undefined,
            proteinPer100g: isGramOrMl ? pPerUnit : undefined,
            carbsPer100g: isGramOrMl ? cPerUnit : undefined,
            fatPer100g: isGramOrMl ? fPerUnit : undefined,
            caloriesPerPiece: !isGramOrMl ? calPerUnit : undefined,
            proteinPerPiece: !isGramOrMl ? pPerUnit : undefined,
            carbsPerPiece: !isGramOrMl ? cPerUnit : undefined,
            fatPerPiece: !isGramOrMl ? fPerUnit : undefined,
            timesUsed: count,
            source: count > 1 ? `Logged ${count}x` : 'Recent Food',
            icon: getFoodIcon(item.name),
          });
        }
      }
    }

    // 3. If still < 6 (e.g., new user), fill with starter staples
    const starterStaples = [
      {
        name: 'Chicken Breast',
        category: 'Protein',
        unitType: 'gram',
        unit: 'gram',
        caloriesPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        fatPer100g: 3.6,
        caloriesPerUnit: 165,
        proteinPerUnit: 31,
        carbsPerUnit: 0,
        fatPerUnit: 3.6,
        source: 'Starter Staple',
        icon: '🍗',
      },
      {
        name: 'Boiled Egg',
        category: 'Protein',
        unitType: 'piece',
        unit: 'piece',
        caloriesPerPiece: 78,
        proteinPerPiece: 6.3,
        carbsPerPiece: 0.6,
        fatPerPiece: 5.3,
        caloriesPerUnit: 78,
        proteinPerUnit: 6.3,
        carbsPerUnit: 0.6,
        fatPerUnit: 5.3,
        source: 'Starter Staple',
        icon: '🥚',
      },
      {
        name: 'Brown Rice',
        category: 'Grains',
        unitType: 'gram',
        unit: 'gram',
        caloriesPer100g: 112,
        proteinPer100g: 2.6,
        carbsPer100g: 24,
        fatPer100g: 0.9,
        caloriesPerUnit: 112,
        proteinPerUnit: 2.6,
        carbsPerUnit: 24,
        fatPerUnit: 0.9,
        source: 'Starter Staple',
        icon: '🍚',
      },
      {
        name: 'Banana',
        category: 'Fruits',
        unitType: 'piece',
        unit: 'piece',
        caloriesPerPiece: 105,
        proteinPerPiece: 1.3,
        carbsPerPiece: 27,
        fatPerPiece: 0.3,
        caloriesPerUnit: 105,
        proteinPerUnit: 1.3,
        carbsPerUnit: 27,
        fatPerUnit: 0.3,
        source: 'Starter Staple',
        icon: '🍌',
      },
      {
        name: 'Oatmeal',
        category: 'Grains',
        unitType: 'gram',
        unit: 'gram',
        caloriesPer100g: 389,
        proteinPer100g: 16.9,
        carbsPer100g: 66,
        fatPer100g: 6.9,
        caloriesPerUnit: 389,
        proteinPerUnit: 16.9,
        carbsPerUnit: 66,
        fatPerUnit: 6.9,
        source: 'Starter Staple',
        icon: '🥣',
      },
      {
        name: 'Avocado',
        category: 'Healthy Fats',
        unitType: 'piece',
        unit: 'piece',
        caloriesPerPiece: 240,
        proteinPerPiece: 3.0,
        carbsPerPiece: 12,
        fatPerPiece: 22,
        caloriesPerUnit: 240,
        proteinPerUnit: 3.0,
        carbsPerUnit: 12,
        fatPerUnit: 22,
        source: 'Starter Staple',
        icon: '🥑',
      },
    ];

    for (const staple of starterStaples) {
      const key = staple.name.toLowerCase().trim();
      if (!seenNames.has(key) && frequentList.length < 8) {
        seenNames.add(key);
        frequentList.push(staple);
      }
    }

    res.json(frequentList);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch frequent food items' });
  }
};

export const searchFoodItems = async (req, res) => {
  try {
    const { q } = req.query;
    const queryStr = (q || '').trim().toLowerCase();

    // 1. User saved food items
    const userFilter = { userId: req.user._id };
    if (queryStr) userFilter.name = { $regex: queryStr, $options: 'i' };
    const userFoods = await FoodItem.find(userFilter).sort({ timesUsed: -1, lastUsedAt: -1 }).limit(10);

    // 2. Curated nutritional database
    let curatedMatches = [];
    if (queryStr) {
      curatedMatches = CURATED_FOODS.filter((f) =>
        f.name.toLowerCase().includes(queryStr) || f.category.toLowerCase().includes(queryStr)
      ).slice(0, 10);
    } else {
      curatedMatches = CURATED_FOODS.slice(0, 8);
    }

    // 3. Online Open Food Facts search fallback (if query >= 2 chars)
    let onlineFoods = [];
    if (queryStr.length >= 2) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(queryStr)}&search_simple=1&action=process&json=1&page_size=6`;
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.products)) {
            onlineFoods = data.products
              .filter((p) => p.product_name && p.product_name.trim().length > 0)
              .map((p) => ({
                name: p.product_name.trim(),
                category: 'Online Database',
                unit: 'gram',
                caloriesPer100g: Math.round(Number(p.nutriments?.['energy-kcal_100g']) || 0),
                proteinPer100g: Math.round((Number(p.nutriments?.proteins_100g) || 0) * 10) / 10,
                carbsPer100g: Math.round((Number(p.nutriments?.carbohydrates_100g) || 0) * 10) / 10,
                fatPer100g: Math.round((Number(p.nutriments?.fat_100g) || 0) * 10) / 10,
                caloriesPerUnit: Math.round(Number(p.nutriments?.['energy-kcal_100g']) || 0),
                source: 'Open Food Facts',
              }))
              .filter((f) => f.caloriesPer100g > 0);
          }
        }
      } catch (e) {
        // Silently skip online search if timeout or offline
      }
    }

    // Merge & Deduplicate by lowercased name
    const seenNames = new Set();
    const combined = [];

    // Helper to add unique item
    const addFood = (item, source) => {
      const key = (item.name || '').toLowerCase().trim();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        const itemUnit = item.unit || item.unitType || 'gram';
        const isGramOrMl = itemUnit === 'gram' || itemUnit === 'g' || itemUnit === 'ml';

        const calPerUnit = item.caloriesPerUnit !== undefined
          ? Number(item.caloriesPerUnit)
          : isGramOrMl
          ? Number(item.caloriesPer100g ?? 100)
          : Number(item.caloriesPerPiece ?? 100);

        const pPerUnit = item.proteinPerUnit !== undefined
          ? Number(item.proteinPerUnit)
          : isGramOrMl
          ? Number(item.proteinPer100g ?? 0)
          : Number(item.proteinPerPiece ?? 0);

        const cPerUnit = item.carbsPerUnit !== undefined
          ? Number(item.carbsPerUnit)
          : isGramOrMl
          ? Number(item.carbsPer100g ?? 0)
          : Number(item.carbsPerPiece ?? 0);

        const fPerUnit = item.fatPerUnit !== undefined
          ? Number(item.fatPerUnit)
          : isGramOrMl
          ? Number(item.fatPer100g ?? 0)
          : Number(item.fatPerPiece ?? 0);

        combined.push({
          _id: item._id,
          name: item.name,
          category: item.category || 'General',
          unit: itemUnit,
          unitType: itemUnit,
          caloriesPerUnit: calPerUnit,
          proteinPerUnit: pPerUnit,
          carbsPerUnit: cPerUnit,
          fatPerUnit: fPerUnit,
          caloriesPer100g: item.caloriesPer100g || (isGramOrMl ? calPerUnit : 100),
          proteinPer100g: item.proteinPer100g !== undefined ? item.proteinPer100g : (isGramOrMl ? pPerUnit : 0),
          carbsPer100g: item.carbsPer100g !== undefined ? item.carbsPer100g : (isGramOrMl ? cPerUnit : 0),
          fatPer100g: item.fatPer100g !== undefined ? item.fatPer100g : (isGramOrMl ? fPerUnit : 0),
          caloriesPerPiece: item.caloriesPerPiece || (!isGramOrMl ? calPerUnit : 100),
          proteinPerPiece: item.proteinPerPiece !== undefined ? item.proteinPerPiece : (!isGramOrMl ? pPerUnit : 0),
          carbsPerPiece: item.carbsPerPiece !== undefined ? item.carbsPerPiece : (!isGramOrMl ? cPerUnit : 0),
          fatPerPiece: item.fatPerPiece !== undefined ? item.fatPerPiece : (!isGramOrMl ? fPerUnit : 0),
          source,
        });
      }
    };

    userFoods.forEach((f) => addFood(f, 'user'));
    curatedMatches.forEach((f) => addFood(f, 'verified'));
    onlineFoods.forEach((f) => addFood(f, 'online'));

    res.json(combined.slice(0, 15));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to search foods' });
  }
};

export const searchWorkoutTypes = async (req, res) => {
  try {
    const { q } = req.query;
    const queryStr = (q || '').trim().toLowerCase();

    // 1. User custom workout types
    const filter = { userId: req.user._id };
    if (queryStr) filter.name = { $regex: queryStr, $options: 'i' };
    const userTypes = await WorkoutType.find(filter).sort({ updatedAt: -1 }).limit(10);

    // 2. Curated workout dataset
    let curatedMatches = [];
    if (queryStr) {
      curatedMatches = CURATED_EXERCISES.filter((e) =>
        e.name.toLowerCase().includes(queryStr) ||
        e.muscle.toLowerCase().includes(queryStr) ||
        e.target.toLowerCase().includes(queryStr)
      ).slice(0, 10);
    } else {
      curatedMatches = CURATED_EXERCISES.slice(0, 8);
    }

    // 3. Online Wger Exercise API query fallback (if query >= 3 chars)
    let onlineExercises = [];
    if (queryStr.length >= 3) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const url = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(queryStr)}`;
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.suggestions)) {
            onlineExercises = data.suggestions.slice(0, 5).map((s) => ({
              name: s.value.trim(),
              target: 'Muscle',
              trackingType: 'sets_reps',
              muscle: s.data?.category || 'General',
              equipment: 'Gym Equipment',
              met: 5.5,
              caloriesPerRep: 0.8,
              defaultSets: 3,
              defaultReps: 10,
              source: 'wger',
            }));
          }
        }
      } catch (e) {
        // Silently skip if offline
      }
    }

    // Merge & Deduplicate
    const seenNames = new Set();
    const combined = [];

    const addWorkout = (item, source) => {
      const key = (item.name || '').toLowerCase().trim();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        combined.push({
          _id: item._id,
          name: item.name,
          target: item.target || 'Muscle',
          trackingType: item.trackingType || 'sets_reps',
          muscle: item.muscle || item.target || 'Full Body',
          equipment: item.equipment || 'Standard',
          met: item.met || (item.target === 'Cardio' ? 8.0 : 5.5),
          caloriesPerSet: item.caloriesPerSet || 8,
          caloriesPerRep: item.caloriesPerRep || 0.8,
          defaultCaloriesPerMinute: item.defaultCaloriesPerMinute || 6,
          defaultSets: item.defaultSets || 3,
          defaultReps: item.defaultReps || 10,
          defaultDuration: item.defaultDuration || 30,
          defaultWeight: item.defaultWeight || 0,
          source,
        });
      }
    };

    userTypes.forEach((t) => addWorkout(t, 'user'));
    curatedMatches.forEach((t) => addWorkout(t, 'verified'));
    onlineExercises.forEach((t) => addWorkout(t, 'online'));

    res.json(combined.slice(0, 15));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to search workout types' });
  }
};

// --- Body Metrics & Water ---

export const getBodyMetrics = async (req, res) => {
  try {
    const metrics = await BodyMetric.find({ userId: req.user._id }).sort({ date: 1 });
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch metrics' });
  }
};

export const createBodyMetric = async (req, res) => {
  try {
    const {
      date,
      weightKg,
      heightCm,
      waistCm,
      bodyFatPercent,
      chestCm,
      armCm,
      shouldersCm,
      hipsCm,
      thighsCm,
      calvesCm,
      neckCm,
      notes,
    } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const metric = await BodyMetric.findOneAndUpdate(
      { userId: req.user._id, date },
      {
        weightKg: weightKg !== undefined && weightKg !== null && weightKg !== '' ? Number(weightKg) : undefined,
        heightCm: heightCm !== undefined && heightCm !== null && heightCm !== '' ? Number(heightCm) : undefined,
        waistCm: waistCm !== undefined && waistCm !== null && waistCm !== '' ? Number(waistCm) : undefined,
        bodyFatPercent: bodyFatPercent !== undefined && bodyFatPercent !== null && bodyFatPercent !== '' ? Number(bodyFatPercent) : undefined,
        chestCm: chestCm !== undefined && chestCm !== null && chestCm !== '' ? Number(chestCm) : undefined,
        armCm: armCm !== undefined && armCm !== null && armCm !== '' ? Number(armCm) : undefined,
        shouldersCm: shouldersCm !== undefined && shouldersCm !== null && shouldersCm !== '' ? Number(shouldersCm) : undefined,
        hipsCm: hipsCm !== undefined && hipsCm !== null && hipsCm !== '' ? Number(hipsCm) : undefined,
        thighsCm: thighsCm !== undefined && thighsCm !== null && thighsCm !== '' ? Number(thighsCm) : undefined,
        calvesCm: calvesCm !== undefined && calvesCm !== null && calvesCm !== '' ? Number(calvesCm) : undefined,
        neckCm: neckCm !== undefined && neckCm !== null && neckCm !== '' ? Number(neckCm) : undefined,
        notes: notes?.trim() || '',
      },
      { new: true, upsert: true }
    );

    res.status(201).json(metric);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save body metric' });
  }
};

export const updateBodyMetric = async (req, res) => {
  try {
    const metric = await BodyMetric.findOne({ _id: req.params.id, userId: req.user._id });
    if (!metric) return res.status(404).json({ message: 'Body metric not found' });

    const {
      date,
      weightKg,
      heightCm,
      waistCm,
      bodyFatPercent,
      chestCm,
      armCm,
      shouldersCm,
      hipsCm,
      thighsCm,
      calvesCm,
      neckCm,
      notes,
    } = req.body;

    if (date) metric.date = date;
    if (weightKg !== undefined) metric.weightKg = weightKg !== null && weightKg !== '' ? Number(weightKg) : undefined;
    if (heightCm !== undefined) metric.heightCm = heightCm !== null && heightCm !== '' ? Number(heightCm) : undefined;
    if (waistCm !== undefined) metric.waistCm = waistCm !== null && waistCm !== '' ? Number(waistCm) : undefined;
    if (bodyFatPercent !== undefined) metric.bodyFatPercent = bodyFatPercent !== null && bodyFatPercent !== '' ? Number(bodyFatPercent) : undefined;
    if (chestCm !== undefined) metric.chestCm = chestCm !== null && chestCm !== '' ? Number(chestCm) : undefined;
    if (armCm !== undefined) metric.armCm = armCm !== null && armCm !== '' ? Number(armCm) : undefined;
    if (shouldersCm !== undefined) metric.shouldersCm = shouldersCm !== null && shouldersCm !== '' ? Number(shouldersCm) : undefined;
    if (hipsCm !== undefined) metric.hipsCm = hipsCm !== null && hipsCm !== '' ? Number(hipsCm) : undefined;
    if (thighsCm !== undefined) metric.thighsCm = thighsCm !== null && thighsCm !== '' ? Number(thighsCm) : undefined;
    if (calvesCm !== undefined) metric.calvesCm = calvesCm !== null && calvesCm !== '' ? Number(calvesCm) : undefined;
    if (neckCm !== undefined) metric.neckCm = neckCm !== null && neckCm !== '' ? Number(neckCm) : undefined;
    if (notes !== undefined) metric.notes = notes.trim();

    await metric.save();
    res.json(metric);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update body metric' });
  }
};

export const deleteBodyMetric = async (req, res) => {
  try {
    const metric = await BodyMetric.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!metric) return res.status(404).json({ message: 'Body metric not found' });
    res.json({ message: 'Body metric deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete body metric' });
  }
};

export const getWaterLog = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const log = await WaterLog.findOne({ userId: req.user._id, date });
    res.json(log || { date, glasses: 0, ml: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch water log' });
  }
};

export const logWater = async (req, res) => {
  try {
    const { date, glasses, ml, increment } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    let log = await WaterLog.findOne({ userId: req.user._id, date });

    if (!log) {
      log = new WaterLog({ userId: req.user._id, date, glasses: 0, ml: 0 });
    }

    if (increment) {
      log.glasses = Math.max(0, log.glasses + Number(increment));
      log.ml = log.glasses * 250;
    } else {
      if (glasses !== undefined) {
        log.glasses = Number(glasses);
        log.ml = log.glasses * 250;
      }
      if (ml !== undefined) log.ml = Number(ml);
    }

    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log water' });
  }
};

// --- Health Aggregated Summary ---

export const getHealthSummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const user = await User.findById(req.user._id);
    const dailyCalorieGoal = user?.dailyCalorieGoal || 2000;

    const [meals, workouts, water] = await Promise.all([
      Meal.find({ userId: req.user._id, date }),
      Workout.find({ userId: req.user._id, date }),
      WaterLog.findOne({ userId: req.user._id, date }),
    ]);

    let caloriesConsumed = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals.forEach((m) => {
      caloriesConsumed += m.totalCalories || 0;
      totalProtein += m.totalProtein || 0;
      totalCarbs += m.totalCarbs || 0;
      totalFat += m.totalFat || 0;
    });

    let caloriesBurned = 0;
    workouts.forEach((w) => {
      caloriesBurned += w.caloriesBurned || 0;
    });

    res.json({
      date,
      dailyCalorieGoal,
      caloriesConsumed,
      caloriesBurned,
      netCalories: caloriesConsumed - caloriesBurned,
      remainingCalories: Math.max(0, dailyCalorieGoal - caloriesConsumed),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
      waterGlasses: water?.glasses || 0,
      waterMl: water?.ml || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch health summary' });
  }
};
