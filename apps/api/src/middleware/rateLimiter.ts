import rateLimit from "express-rate-limit";

const isDev = process.env["NODE_ENV"] !== "production" || process.env["RENDER"] !== "true";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, slow down." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
});

export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 500 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Post limit reached. Try again later." },
});
