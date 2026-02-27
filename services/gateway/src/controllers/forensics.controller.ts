import { Request, Response } from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// Multer: memory storage, 50MB limit, CSV only
export const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are accepted'));
        }
    },
});

export const analyzeForensics = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file as Express.Multer.File | undefined;
        if (!file) {
            res.status(400).json({ error: 'No CSV file uploaded' });
            return;
        }

        const userId: string = (req as any).user?.id || '';
        const contamination = parseFloat(req.body.contamination || '0.03');
        const satelliteId: string = req.body.satellite_id || 'unknown';

        // Stream the file to ML-API using form-data
        const form = new FormData();
        form.append('file', file.buffer, {
            filename: file.originalname,
            contentType: 'text/csv',
        });
        form.append('contamination', String(contamination));
        form.append('satellite_id', satelliteId);
        form.append('user_id', userId);

        console.log(`[Gateway] Streaming ${file.size} byte CSV to ML-API for forensics analysis`);

        const mlResponse = await axios.post(
            `${ML_API_URL}/api/v1/forensics/analyze`,
            form,
            {
                headers: form.getHeaders(),
                timeout: 120_000,  // 2 min for large files
                maxBodyLength: 55 * 1024 * 1024,
            }
        );

        res.status(200).json(mlResponse.data);
    } catch (error: any) {
        const status = error?.response?.status;
        const detail = error?.response?.data?.detail;
        console.error('[Gateway] Forensics error:', detail || error.message);
        if (status === 422) {
            res.status(422).json({ error: detail || 'Invalid CSV data' });
        } else if (status === 413) {
            res.status(413).json({ error: 'File too large (max 50 MB)' });
        } else {
            res.status(500).json({ error: 'Forensics analysis failed' });
        }
    }
};
