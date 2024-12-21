"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Github, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";

export function LoginDialog({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleGitHubSignIn = () => {
    // const clientId = process.env.NEXT_PUBLIC_GITHUB_ID;
    // const redirectUri = `${window.location.origin}/api/auth/github`;
    // const scope = "read:user user:email";
    // const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${pathname}`;
    // window.location.href = authUrl;
    signIn("github", {
      redirectTo: `${window.location.origin}/api/auth/github`,
    });
  };

  const handleGoogleSignIn = () => {
    console.log(
      "${window.location.origin}/api/auth/google",
      `${window.location.origin}/api/auth/google`
    );
    signIn("google");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0">
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Choose your preferred sign in method
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button className="w-full" onClick={handleGitHubSignIn}>
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
          <Button className="w-full" onClick={handleGoogleSignIn}>
            <Mail className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
