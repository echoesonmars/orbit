"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrediction = void 0;
const predict_validator_1 = require("../validators/predict.validator");
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';
const getPrediction = async (req, res) => {
    try {
        // 1. Zod Validation
        const parsedBody = predict_validator_1.PredictValueSchema.safeParse(req.body);
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
    }
    catch (error) {
        console.error('[Gateway] Error in getPrediction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getPrediction = getPrediction;
