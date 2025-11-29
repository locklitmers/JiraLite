"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { signInSchema, signUpSchema, resetPasswordSchema, updatePasswordSchema } from "@/lib/validations/auth";
import { sendEmail, getConfirmEmailTemplate } from "@/lib/email";

export async function signUp(formData: FormData) {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = signUpSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { name, email, password } = result.data;
  
  // Check if email already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    return { error: "Email already registered" };
  }

  // Check for pending verification
  const existingToken = await db.verificationToken.findFirst({
    where: { 
      email,
      type: "email_confirm",
      expiresAt: { gt: new Date() }
    },
  });

  if (existingToken) {
    return { error: "A verification email was already sent. Please check your inbox." };
  }

  // Create verification token
  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      type: "email_confirm",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Store pending user data in token (we'll create user after confirmation)
  // For now, store in a simple way - in production you'd want a PendingUser table
  await db.verificationToken.update({
    where: { id: verificationToken.id },
    data: {
      // Store extra data as JSON in a field or use metadata
      // For simplicity, we'll create a pending user approach
    },
  });

  // Use Supabase Auth with email confirmation disabled (we handle it ourselves)
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        email_confirmed: false, // We'll confirm via our own flow
      },
    },
  });

  if (authError) {
    // Clean up verification token
    await db.verificationToken.delete({ where: { id: verificationToken.id } });
    return { error: authError.message };
  }

  // Send custom confirmation email via Nodemailer
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken.token}`;
  
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    await sendEmail({
      to: email,
      subject: "Confirm your email - Jira Lite",
      html: getConfirmEmailTemplate(name, confirmLink),
    });
  }

  // Store user data temporarily for later creation
  if (authData.user) {
    // Create user in database
    await db.user.create({
      data: {
        id: authData.user.id,
        email,
        name,
      },
    });
  }

  // Sign out immediately - user needs to confirm email first
  await supabase.auth.signOut();

  return { 
    success: "Account created! Please check your email to confirm your account.",
    needsConfirmation: true 
  };
}

export async function signIn(formData: FormData) {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = signInSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { email, password } = result.data;
  
  // Check if user exists and email is verified
  const user = await db.user.findUnique({
    where: { email },
  });

  if (user && !user.emailVerified) {
    return { error: "Please verify your email before signing in. Check your inbox for the confirmation link." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPassword(formData: FormData) {
  const rawData = {
    email: formData.get("email") as string,
  };

  const result = resetPasswordSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { email } = result.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?type=recovery`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset email sent. Check your inbox." };
}

export async function updatePassword(formData: FormData) {
  const rawData = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = updatePasswordSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { password } = result.data;
  const supabase = await createClient();

  // Check if user has a valid session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Auth session missing! Please use the link from your email." };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

