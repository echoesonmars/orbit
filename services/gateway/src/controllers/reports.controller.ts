import { Request, Response } from 'express';
import { GenerateReportSchema } from '../validators/reports.validator';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const generateReport = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        const parsed = GenerateReportSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        // Attach user_id from auth token
        const payload = {
            ...parsed.data,
            user_id: req.user?.id || null,
        };

        // Forward to ML-API (returns immediately with task_id)
        const mlResponse = await axios.post(
            `${ML_API_URL}/api/v1/reports/generate`,
            payload,
            { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 }
        );

        res.status(202).json(mlResponse.data);
    } catch (error: any) {
        console.error('[Gateway] Error in generateReport:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to start report generation' });
    }
};

export const getReportStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const mlResponse = await axios.get(
            `${ML_API_URL}/api/v1/reports/${id}/status`,
            { timeout: 8_000 }
        );
        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404) {
            res.status(404).json({ error: 'Report not found' });
        } else {
            console.error('[Gateway] Error in getReportStatus:', error?.response?.data || error.message);
            res.status(500).json({ error: 'Failed to get report status' });
        }
    }
};
