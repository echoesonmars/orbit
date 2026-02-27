import { Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

const EsgSchema = z.object({
    satellite_mass_kg: z.number().positive().max(100_000).default(100),
    propellant_type: z.string().min(1).default('kerosene_rp1'),
    launch_vehicle_class: z.enum(['small', 'medium', 'heavy', 'super_heavy']).default('medium'),
    altitude_km: z.number().positive().max(100_000).default(550),
    has_deorbit_system: z.boolean().default(false),
    expected_lifetime_years: z.number().min(0.5).max(30).default(5),
    has_solar_power: z.boolean().default(true),
    mission_benefit_score: z.number().min(0).max(100).default(70),
    mission_description: z.string().max(500).default(''),
});

export const assessEsg = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = EsgSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
            return;
        }

        const userId: string = (req as any).user?.id || '';

        const mlResponse = await axios.post(
            `${ML_API_URL}/api/v1/esg/assess`,
            { ...parsed.data, user_id: userId },
            { headers: { 'Content-Type': 'application/json' }, timeout: 30_000 }
        );

        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        console.error('[Gateway] ESG error:', error?.response?.data || error.message);
        res.status(500).json({ error: 'ESG assessment failed' });
    }
};

export const getPropellants = async (_req: Request, res: Response): Promise<void> => {
    try {
        const mlResponse = await axios.get(`${ML_API_URL}/api/v1/esg/propellants`, { timeout: 10_000 });
        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        console.error('[Gateway] ESG propellants error:', error.message);
        res.status(500).json({ error: 'Failed to fetch propellant data' });
    }
};
