import { Request, Response } from 'express';
import { PredictValueSchema } from '../validators/predict.validator';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const getPrediction = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Zod Validation
        const parsedBody = PredictValueSchema.safeParse(req.body);

        if (!parsedBody.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: parsedBody.error.flatten().fieldErrors
            });
            return;
        }

        // 2. Mocking Call to internal ML-API via Axios
        // In a real scenario, this would be: await axios.post(`${ML_API_URL}/predict/value`, parsedBody.data);
        console.log(`[Gateway] Received valid request, forwarding to ML-API: ${JSON.stringify(parsedBody.data)}`);

        const mockResponse = {
            value_score: 85.5,
            factors: [
                { name: "cloud_cover", impact: -5 },
                { name: "target_demand", impact: 20 }
            ],
            bbox: parsedBody.data.bbox
        };

        // Simulating network delay
        setTimeout(() => {
            res.status(200).json(mockResponse);
        }, 800);

    } catch (error) {
        console.error('[Gateway] Error in getPrediction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
