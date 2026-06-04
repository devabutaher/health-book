import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten(),
    });
  }

  const prismaErr = err as { code?: string; meta?: unknown };
  if (prismaErr.code === "P2002") {
    return res.status(409).json({ success: false, message: "Already exists" });
  }
  if (prismaErr.code === "P2025") {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
};
