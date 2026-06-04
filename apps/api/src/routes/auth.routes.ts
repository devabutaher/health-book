import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware";
import { authLimiter } from "../middleware";

const router = Router() as ReturnType<typeof Router>;

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authenticate, authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", authenticate, authController.getMe);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/oauth", authController.oauth);

export default router;
