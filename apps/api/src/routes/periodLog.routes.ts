import { Router } from "express";
import { periodLogController } from "../controllers/periodLog.controller";
import { authenticate } from "../middleware";
import { prisma } from "../lib/prisma";

const router = Router() as ReturnType<typeof Router>;

router.use(authenticate);
router.use(async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { gender: true },
    });
    if (user?.gender !== "female") {
      return res
        .status(403)
        .json({ success: false, message: "Period tracking is only available for female accounts" });
    }
    next();
  } catch {
    next();
  }
});

router.get("/", periodLogController.list);
router.post("/", periodLogController.create);
router.get("/:id", periodLogController.getById);
router.put("/:id", periodLogController.update);
router.delete("/:id", periodLogController.remove);

export default router;
