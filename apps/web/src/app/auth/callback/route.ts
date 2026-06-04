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
        const response = NextResponse.redirect(`${origin}/feed`);
        const setCookie = apiRes.headers.get("set-cookie");
        if (setCookie) {
          response.headers.set("set-cookie", setCookie);
        }
        return response;
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
