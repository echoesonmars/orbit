import { Router } from 'express';
import { getPrediction } from '../controllers/predict.controller';
import { searchDataHub } from '../controllers/dataHub.controller';
import { designMission } from '../controllers/missionDesigner.controller';
import { generateReport, getReportStatus } from '../controllers/reports.controller';
import { getUpcomingLaunches, predictDelay } from '../controllers/launches.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Value predictor
router.post('/predict/value', requireAuth, getPrediction);

// Data Hub search
router.post('/data-hub/search', requireAuth, searchDataHub);

// Mission Designer
router.post('/mission-designer/generate', requireAuth, designMission);

// Report Generator
router.post('/reports/generate', requireAuth, generateReport);
router.get('/reports/:id/status', requireAuth, getReportStatus);

// Launch Delay Predictor
router.get('/launches/upcoming', requireAuth, getUpcomingLaunches);
router.post('/launches/predict-delay', requireAuth, predictDelay);

export default router;
