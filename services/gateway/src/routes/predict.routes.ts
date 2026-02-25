import { Router } from 'express';
import { getPrediction } from '../controllers/predict.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Endpoint for receiving predict requests from the Next.js frontend
// Protected by requireAuth middleware
router.post('/predict-value', requireAuth, getPrediction);

export default router;
