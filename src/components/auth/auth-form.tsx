"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register, type AuthState } from "@/lib/actions/auth";

type Mode = "login" | "register";

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : register, undefined);
  const [show, setShow] = useState(false);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-medium">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to track orders, save favourites and check out faster."
            : "Join The UK Edit BD for early access to new UK arrivals, pre-order drops and members-only offers."}
        </p>
      </div>

      <form action={action} className="space-y-5" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "register" && (
          <Field label="Full name" error={err("name")}>
            <Input name="name" autoComplete="name" defaultValue={state?.values?.name} placeholder="Ayesha Rahman" className="h-11" aria-invalid={!!err("name")} />
          </Field>
        )}
        <Field label="Email" error={err("email")}>
          <Input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} placeholder="you@example.com" className="h-11" aria-invalid={!!err("email")} />
        </Field>
        <Field
          label="Password"
          error={err("password")}
          hint={mode === "register" ? "Min. 8 characters with an uppercase letter and a number." : undefined}
        >
          <div className="relative">
            <Input
              name="password"
              type={show ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              className="h-11 pr-10"
              aria-invalid={!!err("password")}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {state?.error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="h-11 w-full rounded-full text-sm tracking-wide">
          {pending && <Loader2 className="animate-spin" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? "New to The UK Edit BD? " : "Already have an account? "}
        <Link
          href={`/${mode === "login" ? "register" : "login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
      <p className="text-center text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Continue shopping as guest
        </Link>
      </p>
    </div>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
