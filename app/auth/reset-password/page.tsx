"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPassword } from "../actions";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const result = await resetPassword(formData);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      setEmailSent(true);
      toast.success(result.success);
    }
    setIsLoading(false);
  }

  if (emailSent) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="space-y-1 px-0 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Link href="/auth/signin">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="space-y-1 px-0">
        <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Reset Link
          </Button>
        </form>

        <Link href="/auth/signin">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

