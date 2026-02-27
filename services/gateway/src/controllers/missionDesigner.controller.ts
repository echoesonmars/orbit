import { Request, Response } from 'express';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const designMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ error: 'Valid messages array is required' });
            return;
        }

        console.log(`[Gateway] Forwarding Mission Designer request to ML-API. Initializing stream...`);

        // Forward to Python ML-API requesting a stream
        const response = await axios.post(`${ML_API_URL}/api/v1/mission-designer/generate`, {
            messages: messages
        }, {
            responseType: 'stream'
        });

        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Pass the stream chunks directly from Python to the Next.js client
        let accumulatedData = '';
        response.data.on('data', (chunk: Buffer) => {
            accumulatedData += chunk.toString();
            res.write(chunk);
        });

        response.data.on('end', async () => {
            res.end();
            // Log the generation history to Supabase for analytics
            try {
                const userId = req.user?.id;
                if (userId && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
                    const { createClient } = require('@supabase/supabase-js');
                    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
                        global: { headers: { Authorization: req.headers.authorization || '' } }
                    });

                    const spec = JSON.parse(accumulatedData);
                    const lastUserMessage = messages.slice().reverse().find((m: any) => m.role === 'user')?.content || 'Unknown';

                    await supabase.from('mission_designs').insert({
                        user_id: userId,
                        prompt: lastUserMessage,
                        full_chat_history: messages,
                        result_json: spec
                    });
                    console.log(`[Gateway] Mission Design logged to Supabase for user ${userId}`);
                }
            } catch (err: any) {
                console.error('[Gateway] Failed to parse/log mission to Supabase silently:', err.message);
            }
        });

        response.data.on('error', (err: any) => {
            console.error('[Gateway] Stream error:', err);
            res.end();
        });

    } catch (error: any) {
        console.error('[Gateway] Error in designMission forwarding:', error.message);
        if (error.response && error.response.status) {
            res.status(error.response.status).json({
                error: `ML-API returned status ${error.response.status}`
            });
        } else {
            res.status(500).json({ error: 'Internal Server Error forwarding to ML-API' });
        }
    }
};
