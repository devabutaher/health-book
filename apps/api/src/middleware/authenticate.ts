import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = header.split("Bearer ")[1];
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  // Resolve Prisma user ID (handles OAuth where Supabase Auth ID differs from Prisma PK)
  let userId = data.user.id;
  if (data.user.email) {
    const prismaUser = await prisma.user.findUnique({
      where: { email: data.user.email },
      select: { id: true },
    });
    if (prismaUser) userId = prismaUser.id;
  }

  req.user = { id: userId, email: data.user.email };
  next();
};
