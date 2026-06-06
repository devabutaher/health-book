import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      const apiRes = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/auth/oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        }),
      });

      if (apiRes.ok) {
        const body = await apiRes.json();
        const response = NextResponse.redirect(`${origin}/feed`);
        response.cookies.set("hb_at", body.data.accessToken, {
          httpOnly: false,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60,
        });
        response.cookies.set("hb_rt", body.data.refreshToken, {
          httpOnly: false,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 604800,
        });
        response.cookies.set("hb_token", body.data.accessToken, {
          httpOnly: false,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 604800,
        });
        return response;
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
