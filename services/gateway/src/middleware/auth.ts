import { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend Express Request interface to include a user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('[Warning] SUPABASE_URL or SUPABASE_ANON_KEY is not set. Auth middleware might fail.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify the JWT token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.warn('[Auth Middleware] Verification failed:', error?.message);
            res.status(401).json({ error: 'Unauthorized: Invalid token' });
            return;
        }

        // Attach user information to the request for subsequent controllers
        req.user = user;
        next();
    } catch (err) {
        console.error('[Auth Middleware] Error:', err);
        res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};
