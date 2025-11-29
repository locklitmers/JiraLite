import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { UpdateProfileForm } from "./update-profile-form";
import { ThemeSelector } from "./theme-selector";
import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccountForm } from "./delete-account-form";

export default async function SettingsPage() {
  const user = await getUser();
  const supabase = await createClient();
  
  if (!user) {
    return null;
  }

  // Check if user signed up with OAuth (no password)
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const isOAuthUser = authUser?.app_metadata?.provider !== "email";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user.name || "No name"}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <UpdateProfileForm user={user} />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how Jira Lite looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* Security */}
      {!isOAuthUser && (
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Update your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user.email} disabled className="mt-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              Contact support to change your email address.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <DeleteAccountForm isOAuthUser={isOAuthUser} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

