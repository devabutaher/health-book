import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router() as ReturnType<typeof Router>;

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected", timestamp: new Date().toISOString() });
  }
});

export default router;
