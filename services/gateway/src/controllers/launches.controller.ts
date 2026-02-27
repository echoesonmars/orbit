import { Request, Response } from 'express';
import { PredictDelaySchema } from '../validators/launches.validator';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// ─── In-Memory Cache (1 hour TTL) ────────────────────────────────────────────
let launchesCache: { data: any; expires: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const getUpcomingLaunches = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Check cache
        if (launchesCache && Date.now() < launchesCache.expires) {
            console.log('[Gateway] Serving launches from cache');
            res.status(200).json(launchesCache.data);
            return;
        }

        console.log('[Gateway] Fetching launches from ML-API');
        const mlResponse = await axios.get(`${ML_API_URL}/api/v1/launches/upcoming`, {
            timeout: 20_000,
        });

        // Update cache
        launchesCache = {
            data: mlResponse.data,
            expires: Date.now() + CACHE_TTL_MS,
        };

        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        console.error('[Gateway] Error in getUpcomingLaunches:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch upcoming launches' });
    }
};

export const predictDelay = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = PredictDelaySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const mlResponse = await axios.post(
            `${ML_API_URL}/api/v1/launches/predict-delay`,
            parsed.data,
            { headers: { 'Content-Type': 'application/json' }, timeout: 20_000 }
        );

        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404) {
            res.status(404).json({ error: 'Launch not found' });
        } else {
            console.error('[Gateway] Error in predictDelay:', error?.response?.data || error.message);
            res.status(500).json({ error: 'Failed to predict delay' });
        }
    }
};
