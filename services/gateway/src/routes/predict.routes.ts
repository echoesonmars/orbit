import { Router } from 'express';
import { getPrediction } from '../controllers/predict.controller';
import { searchDataHub } from '../controllers/dataHub.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Endpoint for receiving predict requests from the Next.js frontend
// Protected by requireAuth middleware
router.post('/predict-value', requireAuth, getPrediction);

// Data Hub search route
router.post('/data-hub/search', requireAuth, searchDataHub);

export default router;
