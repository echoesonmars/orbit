import { z } from 'zod';

export const PredictDelaySchema = z.object({
    launch_id: z.string().min(1, 'Launch ID is required'),
});

export type PredictDelayRequest = z.infer<typeof PredictDelaySchema>;
