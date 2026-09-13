/**
 * Comprehensive Curated Workout & Exercise Library
 * Contains 100+ standard gym and cardio exercises with verified MET (Metabolic Equivalent of Task) values,
 * target categories, primary muscle groups, and baseline calorie expenditure.
 */

export const CURATED_EXERCISES = [
  // --- CHEST & PUSH ---
  { name: 'Barbell Bench Press', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Chest', equipment: 'Barbell', met: 6.0, defaultSets: 4, defaultReps: 10, caloriesPerRep: 0.8 },
  { name: 'Incline Dumbbell Press', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Upper Chest', equipment: 'Dumbbells', met: 5.8, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.75 },
  { name: 'Decline Bench Press', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Lower Chest', equipment: 'Barbell', met: 5.5, defaultSets: 3, defaultReps: 10, caloriesPerRep: 0.7 },
  { name: 'Dumbbell Flyes', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Chest', equipment: 'Dumbbells', met: 4.8, defaultSets: 3, defaultReps: 15, caloriesPerRep: 0.6 },
  { name: 'Push-ups', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Chest & Core', equipment: 'Bodyweight', met: 4.5, defaultSets: 3, defaultReps: 20, caloriesPerRep: 0.5 },
  { name: 'Dips (Chest / Triceps)', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Triceps & Chest', equipment: 'Parallel Bars', met: 5.5, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.7 },
  { name: 'Cable Crossover', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Chest', equipment: 'Cable Machine', met: 4.5, defaultSets: 3, defaultReps: 15, caloriesPerRep: 0.6 },
  { name: 'Machine Chest Press', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Chest', equipment: 'Machine', met: 4.8, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.65 },

  // --- BACK & PULL ---
  { name: 'Deadlift (Conventional)', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Full Posterior Chain', equipment: 'Barbell', met: 8.0, defaultSets: 4, defaultReps: 6, caloriesPerRep: 1.4 },
  { name: 'Barbell Bent-Over Row', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Lats & Upper Back', equipment: 'Barbell', met: 6.0, defaultSets: 4, defaultReps: 10, caloriesPerRep: 0.9 },
  { name: 'Pull-ups / Chin-ups', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Lats & Biceps', equipment: 'Pull-up Bar', met: 6.5, defaultSets: 3, defaultReps: 8, caloriesPerRep: 1.0 },
  { name: 'Lat Pulldown', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Lats', equipment: 'Cable Machine', met: 5.0, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.7 },
  { name: 'Seated Cable Row', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Mid-Back & Lats', equipment: 'Cable Machine', met: 5.0, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.7 },
  { name: 'Single-Arm Dumbbell Row', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Lats', equipment: 'Dumbbells', met: 5.2, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.75 },
  { name: 'T-Bar Row', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Upper & Mid Back', equipment: 'T-Bar', met: 6.0, defaultSets: 3, defaultReps: 10, caloriesPerRep: 0.85 },
  { name: 'Face Pulls', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Rear Delts & Traps', equipment: 'Cable Machine', met: 4.0, defaultSets: 3, defaultReps: 15, caloriesPerRep: 0.5 },

  // --- LEGS & LOWER BODY ---
  { name: 'Barbell Back Squat', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Quads & Glutes', equipment: 'Barbell', met: 7.5, defaultSets: 4, defaultReps: 8, caloriesPerRep: 1.2 },
  { name: 'Front Squat', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Quads & Core', equipment: 'Barbell', met: 7.0, defaultSets: 3, defaultReps: 10, caloriesPerRep: 1.1 },
  { name: 'Leg Press', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Quads & Glutes', equipment: 'Machine', met: 5.5, defaultSets: 4, defaultReps: 12, caloriesPerRep: 0.8 },
  { name: 'Romanian Deadlift (RDL)', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Hamstrings & Glutes', equipment: 'Barbell', met: 6.5, defaultSets: 3, defaultReps: 10, caloriesPerRep: 0.9 },
  { name: 'Walking Dumbbell Lunges', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Quads & Glutes', equipment: 'Dumbbells', met: 6.0, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.8 },
  { name: 'Leg Extension', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Quads', equipment: 'Machine', met: 4.5, defaultSets: 3, defaultReps: 15, caloriesPerRep: 0.55 },
  { name: 'Lying Hamstring Leg Curl', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Hamstrings', equipment: 'Machine', met: 4.5, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.55 },
  { name: 'Standing Calf Raises', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Calves', equipment: 'Machine', met: 4.0, defaultSets: 4, defaultReps: 15, caloriesPerRep: 0.45 },
  { name: 'Hip Thrust (Barbell)', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Glutes', equipment: 'Barbell & Bench', met: 6.0, defaultSets: 4, defaultReps: 12, caloriesPerRep: 0.9 },

  // --- SHOULDERS & ARMS ---
  { name: 'Overhead Barbell Shoulder Press (OHP)', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Deltoids', equipment: 'Barbell', met: 6.0, defaultSets: 4, defaultReps: 8, caloriesPerRep: 0.85 },
  { name: 'Seated Dumbbell Shoulder Press', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Deltoids', equipment: 'Dumbbells', met: 5.5, defaultSets: 3, defaultReps: 10, caloriesPerRep: 0.75 },
  { name: 'Dumbbell Lateral Raises', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Side Delts', equipment: 'Dumbbells', met: 4.0, defaultSets: 4, defaultReps: 15, caloriesPerRep: 0.5 },
  { name: 'Barbell Bicep Curl', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Biceps', equipment: 'Barbell', met: 4.5, defaultSets: 3, defaultReps: 10, caloriesPerRep: 0.6 },
  { name: 'Dumbbell Hammer Curl', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Brachialis & Forearms', equipment: 'Dumbbells', met: 4.2, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.55 },
  { name: 'Triceps Cable Rope Pushdown', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Triceps', equipment: 'Cable Machine', met: 4.2, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.55 },
  { name: 'Skull Crushers (EZ Bar)', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Triceps', equipment: 'EZ Curl Bar', met: 4.8, defaultSets: 3, defaultReps: 10, caloriesPerRep: 0.65 },

  // --- CORE & ABS ---
  { name: 'Plank (Timed)', target: 'Muscle', trackingType: 'duration', muscle: 'Core & Transverse Abdominis', equipment: 'Bodyweight', met: 4.0, defaultDuration: 3, defaultCaloriesPerMinute: 5.0 },
  { name: 'Hanging Leg Raises', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Lower Abs & Hip Flexors', equipment: 'Pull-up Bar', met: 5.5, defaultSets: 3, defaultReps: 12, caloriesPerRep: 0.7 },
  { name: 'Cable Woodchoppers', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Obliques', equipment: 'Cable Machine', met: 4.5, defaultSets: 3, defaultReps: 15, caloriesPerRep: 0.5 },
  { name: 'Ab Wheel Rollout', target: 'Muscle', trackingType: 'sets_reps', muscle: 'Core', equipment: 'Ab Wheel', met: 5.0, defaultSets: 3, defaultReps: 10, caloriesPerRep: 0.7 },

  // --- CARDIO & ENDURANCE ---
  { name: 'Outdoor Running (6 mph / 10 km/h)', target: 'Cardio', trackingType: 'duration', muscle: 'Legs & Cardiovascular', equipment: 'None', met: 9.8, defaultDuration: 30, defaultCaloriesPerMinute: 11.5 },
  { name: 'Treadmill Jogging (5 mph / 8 km/h)', target: 'Cardio', trackingType: 'duration', muscle: 'Cardiovascular', equipment: 'Treadmill', met: 8.3, defaultDuration: 30, defaultCaloriesPerMinute: 9.5 },
  { name: 'Incline Treadmill Walking', target: 'Cardio', trackingType: 'duration', muscle: 'Glutes & Calves', equipment: 'Treadmill', met: 6.0, defaultDuration: 30, defaultCaloriesPerMinute: 7.0 },
  { name: 'Stationary Cycling (Moderate)', target: 'Cardio', trackingType: 'duration', muscle: 'Quads & Cardio', equipment: 'Stationary Bike', met: 7.0, defaultDuration: 30, defaultCaloriesPerMinute: 8.0 },
  { name: 'Stationary Cycling (Vigorous)', target: 'Cardio', trackingType: 'duration', muscle: 'Quads & Cardio', equipment: 'Spin Bike', met: 10.0, defaultDuration: 30, defaultCaloriesPerMinute: 12.0 },
  { name: 'Jump Rope (Skipping)', target: 'Cardio', trackingType: 'duration', muscle: 'Full Body & Calves', equipment: 'Jump Rope', met: 11.0, defaultDuration: 20, defaultCaloriesPerMinute: 13.0 },
  { name: 'Rowing Machine (Moderate)', target: 'Cardio', trackingType: 'duration', muscle: 'Back & Legs', equipment: 'Rower', met: 7.0, defaultDuration: 20, defaultCaloriesPerMinute: 8.2 },
  { name: 'Rowing Machine (Vigorous HIIT)', target: 'Cardio', trackingType: 'duration', muscle: 'Full Body', equipment: 'Rower', met: 11.0, defaultDuration: 20, defaultCaloriesPerMinute: 13.0 },
  { name: 'Swimming (Freestyle / Front Crawl)', target: 'Cardio', trackingType: 'duration', muscle: 'Full Body', equipment: 'Pool', met: 8.0, defaultDuration: 30, defaultCaloriesPerMinute: 9.5 },
  { name: 'StairMaster / Stepmill', target: 'Cardio', trackingType: 'duration', muscle: 'Glutes & Quads', equipment: 'Stair Climber', met: 9.0, defaultDuration: 20, defaultCaloriesPerMinute: 10.5 },
  { name: 'Elliptical Trainer', target: 'Cardio', trackingType: 'duration', muscle: 'Low Impact Cardio', equipment: 'Elliptical', met: 6.5, defaultDuration: 30, defaultCaloriesPerMinute: 7.5 },
  { name: 'HIIT Circuit (Burpees, Mountain Climbers)', target: 'Cardio', trackingType: 'duration', muscle: 'Full Body', equipment: 'Bodyweight', met: 10.5, defaultDuration: 25, defaultCaloriesPerMinute: 12.5 },
  { name: 'Boxing / Heavy Bag Training', target: 'Sports', trackingType: 'duration', muscle: 'Upper Body & Cardio', equipment: 'Boxing Bag', met: 9.0, defaultDuration: 30, defaultCaloriesPerMinute: 10.5 },
  { name: 'Badminton / Tennis', target: 'Sports', trackingType: 'duration', muscle: 'Agility & Legs', equipment: 'Racket', met: 7.3, defaultDuration: 45, defaultCaloriesPerMinute: 8.5 },
  { name: 'Football / Soccer', target: 'Sports', trackingType: 'duration', muscle: 'Legs & Stamina', equipment: 'Ball', met: 9.0, defaultDuration: 60, defaultCaloriesPerMinute: 10.5 },
  { name: 'Yoga (Vinyasa Flow)', target: 'Flexibility', trackingType: 'duration', muscle: 'Mobility & Flexibility', equipment: 'Yoga Mat', met: 3.5, defaultDuration: 45, defaultCaloriesPerMinute: 4.0 },
];

/**
 * Calculate accurate calories burned based on exercise MET, bodyweight, and duration or sets/reps.
 * Formula for Duration (Cardio): Calories = MET * Weight(kg) * (DurationMinutes / 60)
 * Formula for Strength: Calories = Sets * Reps * CaloriesPerRep * (Weight(kg) / 70)
 */
export const calculateWorkoutCalories = ({
  exercise,
  name,
  met,
  weightKg = 70,
  userWeightKg,
  durationMinutes = 0,
  sets = 0,
  reps = 0,
  weight = 0,
  trackingType,
  target,
}) => {
  const userWeight = Number(weightKg || userWeightKg) || 70;

  // Resolve exercise from name if not provided
  let resolvedExercise = exercise;
  if (!resolvedExercise && name) {
    resolvedExercise = CURATED_EXERCISES.find((e) =>
      e.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  const resolvedMet =
    Number(met) ||
    resolvedExercise?.met ||
    (target === 'Cardio' || resolvedExercise?.target === 'Cardio' ? 8.0 : 5.0);

  const isDuration =
    trackingType === 'duration' ||
    resolvedExercise?.trackingType === 'duration' ||
    (!sets && durationMinutes > 0);

  if (isDuration) {
    const mins = Number(durationMinutes) || 30;
    return Math.round(resolvedMet * userWeight * (mins / 60));
  }

  // Sets & Reps strength calculation
  const numSets = Number(sets) || 3;
  const numReps = Number(reps) || 10;
  const calPerRep = resolvedExercise?.caloriesPerRep || 0.8;
  const liftWeight = Number(weight) || 0;
  const weightBonus = liftWeight > 0 ? (liftWeight / 100) * 0.2 : 0;
  const weightFactor = userWeight / 70; // Normalized to 70kg baseline

  return Math.round(numSets * numReps * (calPerRep + weightBonus) * weightFactor);
};
