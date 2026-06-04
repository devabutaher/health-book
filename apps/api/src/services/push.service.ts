import webpush from "web-push"
import { prisma } from "../lib/prisma"

webpush.setVapidDetails(
  "mailto:hello@healthbook.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url: string,
): Promise<void> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })

  if (subs.length === 0) return

  const payload = JSON.stringify({ title, body, url })

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      )
    } catch (err: unknown) {
      if (err instanceof Error) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    }
  }
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY ?? ""
}
