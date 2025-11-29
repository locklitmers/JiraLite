import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        // Check if user exists in database
        const existingUser = await db.user.findUnique({
          where: { id: data.user.id },
        });

        if (!existingUser) {
          // Create user in database - Google OAuth users are auto-verified
          await db.user.create({
            data: {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata.full_name || data.user.user_metadata.name,
              avatarUrl: data.user.user_metadata.avatar_url,
              emailVerified: true, // Google already verified the email
            },
          });
        }
      } catch (dbError) {
        console.error("Database error during OAuth callback:", dbError);
        // Continue anyway - user is authenticated in Supabase
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/signin?error=Could not authenticate`);
}

