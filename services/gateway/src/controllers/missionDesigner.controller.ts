import { Request, Response } from 'express';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const designMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            res.status(400).json({ error: 'Valid prompt string is required' });
            return;
        }

        console.log(`[Gateway] Forwarding Mission Designer request to ML-API. Prompt length: ${prompt.length}`);

        // Forward to Python ML-API
        const response = await axios.post(`${ML_API_URL}/api/v1/mission-designer/generate`, {
            prompt: prompt
        });

        res.status(200).json(response.data);

    } catch (error: any) {
        console.error('[Gateway] Error in designMission forwarding:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Internal Server Error forwarding to ML-API' });
        }
    }
};
