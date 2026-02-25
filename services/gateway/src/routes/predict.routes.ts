import { Router } from 'express';
import { getPrediction } from '../controllers/predict.controller';

const router = Router();

// Endpoint for receiving predict requests from the Next.js frontend
router.post('/predict-value', getPrediction);

export default router;
