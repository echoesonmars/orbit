import { z } from 'zod';

const OrbitParamsSchema = z.object({
    altitude_km: z.number().min(100).max(100_000),
    inclination_deg: z.number().min(0).max(180).default(0),
});

export const OptimizeOrbitSchema = z.object({
    initial_orbit: OrbitParamsSchema,
    target_orbit: OrbitParamsSchema,
    satellite_mass_kg: z.number().positive().max(500_000),
    isp_s: z.number().min(50).max(5000).default(320),
    fuel_cost_per_kg: z.number().positive().default(5000),
});

export type OptimizeOrbitRequest = z.infer<typeof OptimizeOrbitSchema>;
