"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predict_controller_1 = require("../controllers/predict.controller");
const router = (0, express_1.Router)();
// Endpoint for receiving predict requests from the Next.js frontend
router.post('/predict-value', predict_controller_1.getPrediction);
exports.default = router;
