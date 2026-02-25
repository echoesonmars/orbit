import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import predictRoutes from './routes/predict.routes';

// Routes will be added here
app.use('/api/v1', predictRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
});

app.listen(PORT, () => {
    console.log(`🚀 Gateway is running on port ${PORT}`);
});
