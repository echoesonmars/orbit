import { Request, Response } from 'express';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const searchDataHub = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bbox, filters } = req.body;

        // Proxy the request to the Python ML-API
        const mlResponse = await axios.post(`${ML_API_URL}/api/v1/data-hub/search`, {
            bbox,
            filters
        });

        // Send the response back to the Next.js client
        res.json(mlResponse.data);
    } catch (error: any) {
        console.error('Error fetching from ML-API:', error.message);
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.detail || 'Failed to fetch satellite scenes';
        res.status(statusCode).json({ error: errorMessage });
    }
};
