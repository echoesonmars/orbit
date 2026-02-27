import { Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

const SimulateSchema = z.object({
    total_budget_usd: z.number().positive().default(10_000_000),
    launch_cost_usd: z.number().positive().default(2_000_000),
    satellite_cost_usd: z.number().positive().default(3_000_000),
    ops_cost_per_year_usd: z.number().positive().default(500_000),
    launch_failure_prob: z.number().min(0).max(1).default(0.05),
    annual_failure_prob: z.number().min(0).max(1).default(0.02),
    revenue_per_clear_day_usd: z.number().positive().default(1_250),
    clear_days_mu: z.number().positive().max(365).default(200),
    clear_days_sigma: z.number().min(0).default(40),
    revenue_growth_pct_per_year: z.number().min(0).max(1).default(0.05),
    mission_duration_years: z.number().int().min(1).max(20).default(5),
    n_simulations: z.number().int().min(100).max(50_000).default(10_000),
    mission_type: z.string().default('earth_observation'),
});

export const runSimulation = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = SimulateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
            return;
        }

        const userId: string = (req as any).user?.id || '';

        const mlResponse = await axios.post(
            `${ML_API_URL}/api/v1/simulator/run`,
            { ...parsed.data, user_id: userId },
            { headers: { 'Content-Type': 'application/json' }, timeout: 60_000 }
        );

        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        console.error('[Gateway] Simulator error:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Simulation failed' });
    }
};
