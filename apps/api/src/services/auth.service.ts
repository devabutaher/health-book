import { supabase } from "../lib/supabase";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { sendWelcomeEmail } from "./email";

const userSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  bio: true,
  avatar: true,
  coverPhoto: true,
  gender: true,
  role: true,
  isVerified: true,
  createdAt: true,
} as const;

async function ensureUser(supabaseUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const existing = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: userSelect,
  });
  if (existing) return existing;

  // OAuth user might already exist via email signup — return existing record
  if (supabaseUser.email) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
      select: userSelect,
    });
    if (existingByEmail) return existingByEmail;
  }

  const meta = supabaseUser.user_metadata ?? {};
  const emailUser = supabaseUser.email?.split("@")[0] || "user";

  return prisma.user.create({
    data: {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: (meta.name as string) || emailUser,
      username: (meta.username as string) || emailUser,
      gender: "other",
    },
    select: userSelect,
  });
}

export const authService = {
  async register(name: string, email: string, password: string, username: string, gender: string) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error("[Auth] Registration error:", authError);
      throw new AppError(400, "Registration failed. Please check your information.");
    }

    try {
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          name,
          username,
          gender,
        },
      });

      sendWelcomeEmail(user.email, user.name).catch(() => {});

      return user;
    } catch (err) {
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
      throw err;
    }
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("[Auth] Login error:", error);
      throw new AppError(401, "Invalid email or password");
    }

    const profile = await ensureUser(data.user);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: profile,
    };
  },

  async logout(userId: string) {
    const { error } = await supabase.auth.admin.signOut(userId);
    if (error) throw error;
  },

  async refreshUser(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) {
      console.error("[auth] refreshSession failed:", error.message, error.code);
      throw new AppError(401, "Session expired. Please login again.");
    }
    if (!data.session || !data.user) {
      console.error("[auth] refreshSession returned no session or user");
      throw new AppError(401, "Invalid refresh session");
    }

    const profile = await ensureUser(data.user);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: profile,
    };
  },

  async getMe(user: { id: string; email?: string }) {
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: userSelect,
    });
    if (existing) return existing;

    const emailUser = user.email?.split("@")[0] || "user";
    return prisma.user.create({
      data: {
        id: user.id,
        email: user.email || "",
        name: emailUser,
        username: emailUser,
      },
      select: userSelect,
    });
  },

  async oauth(supabaseToken: string, refreshToken?: string) {
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser(supabaseToken);
    if (error || !supabaseUser) throw new AppError(401, "Invalid Supabase token");

    const profile = await ensureUser(supabaseUser);

    return {
      accessToken: supabaseToken,
      refreshToken: refreshToken || "",
      user: profile,
    };
  },

  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env["CLIENT_URL"]}/reset-password`,
    });
    if (error) throw error;
  },
};
