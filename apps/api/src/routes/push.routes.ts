import { Router } from "express"
import { pushController } from "../controllers/push.controller"
import { authenticate } from "../middleware"

const router = Router() as ReturnType<typeof Router>

router.get("/vapid-public-key", pushController.vapidPublicKey)
router.post("/subscribe", authenticate, pushController.subscribe)
router.delete("/unsubscribe", authenticate, pushController.unsubscribe)

export default router
