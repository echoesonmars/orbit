import { z } from 'zod';

const ReportFactorSchema = z.object({
    name: z.string(),
    impact: z.number(),
    type: z.enum(['positive', 'negative', 'crisis']),
});

export const GenerateReportSchema = z.object({
    bbox: z.array(z.number()).length(4, 'BBox must have 4 coordinates'),
    target: z.string().default('default'),
    value_usd: z.number().positive(),
    confidence: z.number().min(0).max(1),
    area_km2: z.number().positive(),
    factors: z.array(ReportFactorSchema).min(1),
    cloud_cover_used: z.number().min(0).max(100).default(20),
    weather_source: z.string().default('Manual Input'),
    nasa: z.any().optional(),
    mission_id: z.string().optional(),
});

export type GenerateReportRequest = z.infer<typeof GenerateReportSchema>;
