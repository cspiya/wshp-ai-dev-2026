"use client";

import { useCallback, useEffect, useState } from "react";

import { createAuthClient } from "@neondatabase/auth/next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const authClient = createAuthClient();

/**
 * Thin Neon Auth panel: email+password sign-up / sign-in against the
 * /api/auth proxy route. In the local in-memory demo the auth service is
 * absent — the panel then reports "not configured" and the server context
 * supplies the fixed local-e2e user, so the flow below stays clickable.
 */
export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await authClient.getSession();
      setSignedInAs(data?.user?.email ?? null);
    } catch {
      setSignedInAs(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    authClient
      .getSession()
      .then(({ data }) => {
        if (active) setSignedInAs(data?.user?.email ?? null);
      })
      .catch(() => {
        if (active) setSignedInAs(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const run = async (action: () => Promise<{ error?: { message?: string } | null }>) => {
    setMessage(null);
    try {
      const { error } = await action();
      if (error) {
        setMessage(error.message ?? "Authentication failed");
        return;
      }
      await refresh();
    } catch {
      setMessage("Auth service is not configured (local demo mode)");
    }
  };

  if (signedInAs) {
    return (
      <section className="space-y-3" aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-lg font-semibold">0. Account</h2>
        <p data-testid="auth-status">Signed in as {signedInAs}</p>
        <Button variant="outline" onClick={() => run(() => authClient.signOut())}>
          Sign out
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="account-heading">
      <h2 id="account-heading" className="text-lg font-semibold">0. Account</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            data-testid="auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            data-testid="auth-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          data-testid="auth-signup"
          onClick={() =>
            run(() =>
              authClient.signUp.email({
                email,
                password,
                name: email.split("@")[0] || "Participant",
              }),
            )
          }
        >
          Sign up
        </Button>
        <Button
          variant="outline"
          data-testid="auth-signin"
          onClick={() => run(() => authClient.signIn.email({ email, password }))}
        >
          Sign in
        </Button>
      </div>
      <p data-testid="auth-status">Signed out</p>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </section>
  );
}
