import { Resend } from "resend";

const resend = new Resend(process.env["RESEND_API_KEY"]);

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: "HealthBook <onboarding@resend.dev>",
    to: email,
    subject: "Welcome to HealthBook!",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #22c55e;">Welcome to HealthBook!</h1>
        <p>Hey ${name},</p>
        <p>Your health journey starts now. Share your routines, track your goals, and connect with a community that cares.</p>
        <p style="margin-top: 32px;">
          <a href="${process.env["CLIENT_URL"]}/feed"
             style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Start exploring →
          </a>
        </p>
        <p style="margin-top: 32px; color: #666; font-size: 14px;">
          Stay healthy,<br/>The HealthBook Team
        </p>
      </div>
    `,
  });
}
