import { Request, Response } from 'express';
import { PredictValueSchema } from '../validators/predict.validator';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// Max area = 2 million km² (roughly the size of Mexico) — prevents abuse
const MAX_AREA_KM2 = 2_000_000;

function bboxAreaKm2(bbox: number[]): number {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    const latMid = ((minLat + maxLat) / 2) * (Math.PI / 180);
    const dx = Math.abs(maxLng - minLng) * Math.cos(latMid) * 111.32;
    const dy = Math.abs(maxLat - minLat) * 111.32;
    return dx * dy;
}

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

        const data = parsedBody.data;

        // 2. Area guard (prevent absurdly large requests)
        const areakm2 = bboxAreaKm2(data.bbox);
        if (areakm2 > MAX_AREA_KM2) {
            res.status(400).json({
                error: `Bounding box too large. Max allowed: ${MAX_AREA_KM2.toLocaleString()} km². Got: ${Math.round(areakm2).toLocaleString()} km².`
            });
            return;
        }

        // 3. Forward to ML-API
        console.log(`[Gateway] Forwarding predict request to ML-API (area: ${Math.round(areakm2)} km²)`);
        const mlResponse = await axios.post(`${ML_API_URL}/predict/value`, data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10_000,
        });

        res.status(200).json(mlResponse.data);

    } catch (error: any) {
        console.error('[Gateway] Error in getPrediction:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
