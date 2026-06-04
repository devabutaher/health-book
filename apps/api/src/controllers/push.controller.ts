import type { Request, Response, NextFunction } from "express"
import { getVapidPublicKey } from "../services/push.service"
import { prisma } from "../lib/prisma"

export const pushController = {
  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const { endpoint, p256dh, auth } = req.body
      if (!endpoint || !p256dh || !auth) {
        res.status(400).json({ success: false, message: "Missing subscription data" })
        return
      }

      await prisma.pushSubscription.upsert({
        where: { endpoint },
        create: {
          userId: req.user!.id,
          endpoint,
          p256dh,
          auth,
          userAgent: req.headers["user-agent"],
        },
        update: { p256dh, auth, userAgent: req.headers["user-agent"] },
      })

      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  },

  async unsubscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const { endpoint } = req.body
      if (!endpoint) {
        res.status(400).json({ success: false, message: "Missing endpoint" })
        return
      }

      await prisma.pushSubscription.deleteMany({
        where: { userId: req.user!.id, endpoint },
      })

      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  },

  async vapidPublicKey(_req: Request, res: Response) {
    res.json({ success: true, publicKey: getVapidPublicKey() })
  },
}
