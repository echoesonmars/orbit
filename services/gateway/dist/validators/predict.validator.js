"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictValueSchema = void 0;
const zod_1 = require("zod");
exports.PredictValueSchema = zod_1.z.object({
    bbox: zod_1.z.array(zod_1.z.number()).length(4, "Bounding box must contain exactly 4 numbers [minLng, minLat, maxLng, maxLat]"),
    target: zod_1.z.string().min(1, "Target is required (e.g., 'monitoring', 'agriculture')"),
});
