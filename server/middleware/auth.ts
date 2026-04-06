import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { storage } from "../storage";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const email = data.user.email || "";

  // Look up DB user by email so req.userId matches our app's user ID (not Supabase auth ID)
  const dbUser = email ? await storage.getUserByEmail(email) : null;

  return {
    userId: dbUser?.id || data.user.id,
    email,
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const user = await verifyToken(token);
  if (!user) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  req.userId = user.userId;
  req.userEmail = user.email;
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const user = await verifyToken(token);
    if (user) {
      req.userId = user.userId;
      req.userEmail = user.email;
    }
  }
  next();
}
