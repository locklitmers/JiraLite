import { acceptInvite } from "../../actions";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle } from "lucide-react";

interface AcceptInvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params;
  
  const invite = await db.teamInvite.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invite) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h3 className="mt-4 text-lg font-semibold">Invalid Invitation</h3>
            <p className="text-muted-foreground mt-2">
              This invitation link is invalid or has already been used.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h3 className="mt-4 text-lg font-semibold">Invitation Expired</h3>
            <p className="text-muted-foreground mt-2">
              This invitation has expired. Please ask for a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleAccept() {
    "use server";
    await acceptInvite(token);
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Join {invite.team.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join this team as a {invite.role.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleAccept}>
            <Button type="submit" className="w-full">
              Accept Invitation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

