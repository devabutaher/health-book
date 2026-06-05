import { Request, Response, NextFunction } from "express";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  oauthSchema,
} from "../utils/validators";
import { authService } from "../services/auth.service";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, username, gender } = registerSchema.parse(req.body);

      await authService.register(name, email, password, username, gender);

      res.status(201).json({
        success: true,
        message: "Account created successfully! Welcome email sent.",
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const result = await authService.login(email, password);

      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.id) {
        await authService.logout(req.user.id).catch(() => {});
      }

      res.clearCookie("refresh_token", { path: "/api/auth" });

      res.json({ success: true, message: "Logged out" });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.["refresh_token"];
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: "No refresh token" });
      }

      const result = await authService.refreshUser(refreshToken);

      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        },
      });
    } catch (err) {
      res.clearCookie("refresh_token", { path: "/api/auth" });
      next(err);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!);

      res.json({ success: true, data: user });
    } catch (err) {
      res.clearCookie("refresh_token", { path: "/api/auth" });
      next(err);
    }
  },

  async oauth(req: Request, res: Response, next: NextFunction) {
    try {
      const { supabaseToken, refreshToken } = oauthSchema.parse(req.body);

      const result = await authService.oauth(supabaseToken, refreshToken);

      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      await authService.forgotPassword(email);

      res.json({ success: true, message: "Password reset email sent" });
    } catch (err) {
      next(err);
    }
  },
};
