import { Request, Response } from 'express';
import { OptimizeOrbitSchema } from '../validators/orbits.validator';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const optimizeOrbit = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = OptimizeOrbitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        // Inject user_id from auth middleware
        const userId = (req as any).user?.id || null;

        const mlResponse = await axios.post(
            `${ML_API_URL}/api/v1/orbits/optimize`,
            { ...parsed.data, user_id: userId },
            { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 }
        );

        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        console.error('[Gateway] Error in optimizeOrbit:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to optimize orbit' });
    }
};
