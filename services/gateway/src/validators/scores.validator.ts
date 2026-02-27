import { z } from 'zod';

const OrbitParamsSchema = z.object({
    altitude_km: z.number().min(100).max(100_000),
    inclination_deg: z.number().min(0).max(180),
    eccentricity: z.number().min(0).max(0.99).default(0),
    satellite_name: z.string().max(50).default('Satellite A'),
});

export const ScoreOrbitSchema = z.object({
    orbits: z.array(OrbitParamsSchema).min(1).max(4),
    business_goal: z.string().min(1),
    target_latitude: z.number().min(-90).max(90).default(45),
});

export type ScoreOrbitRequest = z.infer<typeof ScoreOrbitSchema>;
