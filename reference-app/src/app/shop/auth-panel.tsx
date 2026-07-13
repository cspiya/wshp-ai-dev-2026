"use client";

import { useCallback, useEffect, useState } from "react";

import { createAuthClient } from "@neondatabase/auth/next";

import { CheckGlyph, WarnGlyph } from "@/components/ui/glyphs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const authClient = createAuthClient();

/**
 * Thin Neon Auth panel: email+password sign-up / sign-in against the
 * /api/auth proxy route. In the local in-memory demo the auth service is
 * absent — the panel then reports "not configured" and the server context
 * supplies the fixed local-e2e user, so the flow below stays clickable.
 *
 * `onStatusChange` is a presentation-only mirror for the journey rail;
 * it changes no query, mutation, or observable auth behavior.
 */
export function AuthPanel({
  onStatusChange,
}: {
  onStatusChange?: (email: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    onStatusChange?.(signedInAs);
  }, [signedInAs, onStatusChange]);

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
      <section aria-labelledby="account-heading" className="mod">
        <div className="mod-head">
          <span className="mod-tag" id="account-heading">
            Step 02 · Account
          </span>
          <span className="mod-stat">
            <span className="dotlamp dotlamp-ok" aria-hidden="true" />
            Signed in
          </span>
        </div>
        <div className="mod-body">
          <p
            data-testid="auth-status"
            className="inline-flex items-center gap-1.5 text-sm"
          >
            <CheckGlyph className="text-success" />
            Signed in as {signedInAs}
          </p>
          <div className="mt-4">
            <button
              type="button"
              className="btn-plate min-h-11"
              onClick={() => run(() => authClient.signOut())}
            >
              Sign out
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="account-heading" className="mod">
      <div className="mod-head">
        <span className="mod-tag" id="account-heading">
          Step 02 · Account
        </span>
        <span className="mod-stat">
          <span className="dotlamp dotlamp-amber" aria-hidden="true" />
          Signed out
        </span>
      </div>
      <div className="mod-body">
        <p className="text-sm text-muted-foreground">
          Email + password against the auth proxy — the local demo also runs signed out.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="auth-email" className="micro-label">
              Email
            </Label>
            <Input
              id="auth-email"
              data-testid="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password" className="micro-label">
              Password
            </Label>
            <Input
              id="auth-password"
              data-testid="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="bg-white"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="keycap min-h-11"
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
          </button>
          <button
            type="button"
            className="btn-plate min-h-11"
            data-testid="auth-signin"
            onClick={() => run(() => authClient.signIn.email({ email, password }))}
          >
            Sign in
          </button>
          <p data-testid="auth-status" className="micro-label">
            Signed out
          </p>
        </div>
        {message && (
          <p
            role="alert"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive"
          >
            <WarnGlyph />
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
