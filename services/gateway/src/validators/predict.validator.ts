import { z } from 'zod';

export const PredictValueSchema = z.object({
    bbox: z.array(z.number()).length(4, "Bounding box must contain exactly 4 numbers [minLng, minLat, maxLng, maxLat]"),
    target: z.string().min(1, "Target is required (e.g., 'monitoring', 'agriculture')"),
});

export type PredictValueRequest = z.infer<typeof PredictValueSchema>;
