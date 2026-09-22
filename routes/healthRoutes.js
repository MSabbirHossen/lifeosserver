import express from 'express';
import {
  getFrequentFoodItems,
  searchFoodItems,
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  searchWorkoutTypes,
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getBodyMetrics,
  createBodyMetric,
  updateBodyMetric,
  deleteBodyMetric,
  getWaterLog,
  logWater,
  getHealthSummary,
} from '../controllers/healthController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Summary & Autocomplete
router.get('/summary', getHealthSummary);
router.get('/food-items/frequent', getFrequentFoodItems);
router.get('/food-items/search', searchFoodItems);
router.get('/workout-types/search', searchWorkoutTypes);

// Meals
router.route('/meals').get(getMeals).post(createMeal);
router.route('/meals/:id').put(updateMeal).delete(deleteMeal);

// Workouts
router.route('/workouts').get(getWorkouts).post(createWorkout);
router.route('/workouts/:id').put(updateWorkout).delete(deleteWorkout);

// Body Metrics
router.route('/body-metrics').get(getBodyMetrics).post(createBodyMetric);
router.route('/body-metrics/:id').put(updateBodyMetric).delete(deleteBodyMetric);

// Water Log
router.route('/water').get(getWaterLog).post(logWater);

export default router;
