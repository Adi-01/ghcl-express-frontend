"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginMutation } from "@/lib/hooks/mutations/useAuthMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Ban,
  Clock,
} from "lucide-react";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialUrlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(
    initialUrlError === "account_blocked" || initialUrlError === "session_expired"
      ? initialUrlError
      : null
  );

  const loginMutation = useLoginMutation();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "account_blocked" || errorParam === "session_expired") {
      setUrlError(errorParam);
    } else if (!errorParam) {
      setUrlError(null);
    }
  }, [searchParams]);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isEmailInvalid = email.length > 0 && !isValidEmail(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmailInvalid || !email.trim() || !password.trim()) return;

    setError(null);
    loginMutation.mutate(
      { email, password },
      {
        onError: (err: any) => {
          setError(err?.message || "Invalid credentials. Please try again.");
        },
      }
    );
  };

  return (
    <div className="w-full min-h-screen bg-background flex items-center justify-center p-4">
      <div className="mx-auto w-full max-w-[400px] space-y-8">
        <div
          className={`space-y-2 text-center ${
            urlError ? "" : "lg:text-left"
          }`}
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {urlError === "account_blocked"
              ? "Account Suspended"
              : urlError === "session_expired"
                ? "Session Expired"
                : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {urlError === "account_blocked"
              ? "Access to your account has been restricted."
              : urlError === "session_expired"
                ? "Your previous session timed out."
                : "Enter your credentials to access your dashboard."}
          </p>
        </div>

        {urlError === "account_blocked" ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center dark:bg-red-500/10 dark:text-red-400">
                <Ban className="w-8 h-8" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your account has been blocked by an administrator. Please
                contact IT support or your manager to resolve this issue and
                restore access.
              </p>
            </div>
            <Button
              className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-medium"
              onClick={() => {
                setUrlError(null);
                setError(null);
                router.replace("/login");
              }}
            >
              Refresh Page
            </Button>
          </div>
        ) : urlError === "session_expired" ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center dark:bg-blue-500/10 dark:text-blue-400">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For your security, your session has expired due to inactivity or
                a deliberate logout. You will need to sign in again to continue.
              </p>
            </div>
            <Button
              className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-medium"
              onClick={() => {
                setUrlError(null);
                setError(null);
                router.replace("/login");
              }}
            >
              Log In Again
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 animate-in fade-in duration-300"
          >
            {error && (
              <div className="p-4 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    disabled={loginMutation.isPending}
                    className="pl-11 h-12 rounded-xl bg-secondary/40 border-border text-foreground"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                  />
                </div>
                {isEmailInvalid && (
                  <p className="text-xs text-destructive">
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={loginMutation.isPending}
                    className="pl-11 pr-11 h-12 rounded-xl bg-secondary/40 border-border text-foreground"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loginMutation.isPending}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              type="submit"
              disabled={
                loginMutation.isPending ||
                !email.trim() ||
                !password.trim() ||
                isEmailInvalid
              }
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
