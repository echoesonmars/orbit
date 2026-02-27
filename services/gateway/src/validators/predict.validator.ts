import { z } from 'zod';

export const PredictValueSchema = z.object({
    bbox: z.array(z.number()).length(4, "Bounding box must contain exactly 4 numbers [minLng, minLat, maxLng, maxLat]"),
    target: z.string().min(1).default("default"),
    cloud_cover: z.number().min(-1).max(100).default(20),  // -1 = auto-detect via Open-Meteo
    gsd_meters: z.number().positive().default(10),
    crisis: z.boolean().default(false),
    captured_date: z.string().optional(),
});

export type PredictValueRequest = z.infer<typeof PredictValueSchema>;
