import { Request, Response } from 'express';
import { ScoreOrbitSchema } from '../validators/scores.validator';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const getGoalProfiles = async (_req: Request, res: Response): Promise<void> => {
    try {
        const mlResponse = await axios.get(`${ML_API_URL}/api/v1/orbits/goals`, { timeout: 10_000 });
        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        console.error('[Gateway] Error in getGoalProfiles:', error.message);
        res.status(500).json({ error: 'Failed to fetch goal profiles' });
    }
};

export const scoreOrbit = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = ScoreOrbitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const userId = (req as any).user?.id || null;

        const mlResponse = await axios.post(
            `${ML_API_URL}/api/v1/orbits/score`,
            { ...parsed.data, user_id: userId },
            { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 }
        );

        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        console.error('[Gateway] Error in scoreOrbit:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to score orbit' });
    }
};
