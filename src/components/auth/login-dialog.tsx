'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GithubLogoIcon, EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { signIn } from '@/lib/auth-client';
import { toast } from 'react-hot-toast';

type PendingProvider = 'github' | 'google' | null;

export function LoginDialog({ children }: { children: React.ReactNode }) {
  const [pendingProvider, setPendingProvider] = useState<PendingProvider>(null);

  const handleSocialSignIn = async (provider: 'github' | 'google') => {
    setPendingProvider(provider);
    try {
      const callbackURL = window.location.href;
      const result = await signIn.social({ provider, callbackURL });
      if (result.error) {
        const message = result.error.message ?? 'Sign in failed. Try again.';
        toast.error(message);
        setPendingProvider(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed. Try again.';
      toast.error(message);
      setPendingProvider(null);
    }
  };

  const handleGitHubSignIn = () => {
    void handleSocialSignIn('github');
  };

  const handleGoogleSignIn = () => {
    void handleSocialSignIn('google');
  };

  const anyPending = pendingProvider !== null;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>Choose your preferred sign in method</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button
            className="w-full"
            variant="outline"
            onClick={handleGitHubSignIn}
            disabled={anyPending}
            loading={pendingProvider === 'github'}
          >
            <GithubLogoIcon className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={anyPending}
            loading={pendingProvider === 'google'}
          >
            <EnvelopeSimpleIcon className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
