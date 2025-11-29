import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=Invalid verification link", request.url)
    );
  }

  // Find verification token
  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=Invalid or expired verification link", request.url)
    );
  }

  // Check if expired
  if (verificationToken.expiresAt < new Date()) {
    // Delete expired token
    await db.verificationToken.delete({ where: { id: verificationToken.id } });
    return NextResponse.redirect(
      new URL("/auth/signin?error=Verification link has expired. Please sign up again.", request.url)
    );
  }

  // Update user emailVerified status
  await db.user.update({
    where: { email: verificationToken.email },
    data: { emailVerified: true },
  });

  // Delete the used token
  await db.verificationToken.delete({ where: { id: verificationToken.id } });

  // Redirect to sign in with success message
  return NextResponse.redirect(
    new URL("/auth/signin?verified=true", request.url)
  );
}

