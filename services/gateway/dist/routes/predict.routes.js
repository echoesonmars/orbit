"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predict_controller_1 = require("../controllers/predict.controller");
const dataHub_controller_1 = require("../controllers/dataHub.controller");
const missionDesigner_controller_1 = require("../controllers/missionDesigner.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Endpoint for receiving predict requests from the Next.js frontend
// Protected by requireAuth middleware
router.post('/predict-value', auth_1.requireAuth, predict_controller_1.getPrediction);
// Data Hub search route
router.post('/data-hub/search', auth_1.requireAuth, dataHub_controller_1.searchDataHub);
// Mission Designer route
router.post('/mission-designer/generate', auth_1.requireAuth, missionDesigner_controller_1.designMission);
exports.default = router;
