"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const predict_routes_1 = __importDefault(require("./routes/predict.routes"));
// Routes will be added here
app.use('/api/v1', predict_routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
});
app.listen(PORT, () => {
    console.log(`🚀 Gateway is running on port ${PORT}`);
});
