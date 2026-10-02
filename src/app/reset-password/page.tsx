"use client";

import { FormEvent, useEffect, useState, useMemo, Suspense } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  KeyRound,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { updatePassword, syncLocalPassword } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [error, setError] = useState("");
  const [expiredError, setExpiredError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Parse error parameters from URL query params or URL hash
  useEffect(() => {
    const errorQuery = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    // Check hash for error fragments (e.g. #error=access_denied&error_code=otp_expired)
    let hashError = "";
    let hashErrorDesc = "";
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      hashError = hashParams.get("error") || hashParams.get("error_code") || "";
      hashErrorDesc = hashParams.get("error_description") || "";
    }

    const detectedError = errorQuery || hashError;
    const detectedDesc = errorDesc || hashErrorDesc;

    if (detectedError) {
      const isExpired =
        detectedError.includes("expired") ||
        detectedError.includes("otp_expired") ||
        detectedDesc.toLowerCase().includes("expired");

      setExpiredError(
        isExpired
          ? "Your password reset link has expired or has already been used. Please request a new one."
          : detectedDesc || "The password reset link is invalid or expired. Please request a new one."
      );
      setCheckingSession(false);
      return;
    }

    // Verify or establish recovery session
    const supabase = createClient();

    // Handle hash fragments if present (#access_token=...&refresh_token=...)
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          .then(({ data, error: sessionErr }) => {
            if (sessionErr || !data.session) {
              console.warn("[ResetPassword] Could not establish session from hash:", sessionErr);
              setExpiredError("Your password reset link is invalid or has expired.");
            } else {
              setHasValidSession(true);
            }
            setCheckingSession(false);
          })
          .catch(() => {
            setExpiredError("Failed to verify password reset token.");
            setCheckingSession(false);
          });
        return;
      }
    }

    // Check if session is already active (via PKCE server callback or existing session)
    supabase.auth.getSession().then(({ data: { session }, error: getSessionErr }) => {
      if (getSessionErr || !session) {
        // Listen once for auth state change in case client is still processing tokens
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (newSession && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
            setHasValidSession(true);
            setCheckingSession(false);
            subscription.unsubscribe();
          }
        });

        // Give a short grace period for Supabase client initialization
        const timer = setTimeout(() => {
          subscription.unsubscribe();
          setCheckingSession((current) => {
            if (current) {
              // If still checking and no session arrived
              setExpiredError(
                "No active password reset request found. If you received a link by email, please make sure to click it directly or request a new reset link."
              );
              return false;
            }
            return current;
          });
        }, 1800);

        return () => clearTimeout(timer);
      } else {
        setHasValidSession(true);
        setCheckingSession(false);
      }
    });
  }, [searchParams]);

  // Countdown timer for automatic redirect on success
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      router.push("/signin");
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, router]);

  // Password requirement checks
  const criteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumberOrSymbol: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
      passwordsMatch: Boolean(newPassword && confirmPassword && newPassword === confirmPassword),
    };
  }, [newPassword, confirmPassword]);

  // Strength calculation
  const strengthScore = useMemo(() => {
    let score = 0;
    if (criteria.minLength) score += 1;
    if (criteria.hasUpper) score += 1;
    if (criteria.hasLower) score += 1;
    if (criteria.hasNumberOrSymbol) score += 1;
    return score;
  }, [criteria]);

  const strengthLabel = useMemo(() => {
    if (strengthScore <= 1) return { label: "Weak", color: "bg-rose-500", text: "text-rose-600" };
    if (strengthScore === 2) return { label: "Fair", color: "bg-amber-500", text: "text-amber-600" };
    if (strengthScore === 3) return { label: "Good", color: "bg-blue-500", text: "text-blue-600" };
    return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" };
  }, [strengthScore]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (!criteria.minLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!criteria.passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. First attempt browser-side Supabase client update
      const supabase = createClient();
      const { error: clientError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (!clientError) {
        // Sync local PostgreSQL database hash and sign out session
        await syncLocalPassword(newPassword).catch(() => {});
        setSuccess(true);
        setLoading(false);
        return;
      }

      // 2. If client-side updateUser fails (e.g. cookie-based SSR session), fallback to server action
      const serverRes = await updatePassword(newPassword);

      if (serverRes?.error) {
        setError(serverRes.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Failed to update password. Please try requesting a new reset link.";
      setError(msg);
    }
  }

  // 1. Loading State while inspecting tokens and recovery session
  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">Verifying security token...</p>
          <p className="text-xs text-slate-500">Checking your password reset link credentials</p>
        </div>
      </div>
    );
  }

  // 2. Expired or Invalid Link State
  if (expiredError && !hasValidSession) {
    return (
      <div className="w-full max-w-[420px] rounded-2xl border border-rose-200 bg-white p-7 shadow-sm text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle size={30} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Link Expired or Invalid</h2>
          <p className="text-xs leading-relaxed text-slate-600">
            {expiredError}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-left text-xs text-slate-600 space-y-2 border border-slate-200/60">
          <p className="font-semibold text-slate-800">Why might this happen?</p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
            <li>Reset links expire after 1 hour for security reasons.</li>
            <li>Each reset link can only be used once.</li>
            <li>A newer password reset link may have been requested.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href="/forgot-password"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-sm"
          >
            <span>Request New Reset Link</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/signin"
            className="flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // 3. Success State
  if (success) {
    return (
      <div className="w-full max-w-[420px] rounded-2xl border border-emerald-200 bg-emerald-50/70 p-7 text-center shadow-sm space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">Password Updated!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your password has been changed successfully. You can now use your new password to access your cybersecurity audit environment.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-white/80 p-3 text-xs text-slate-600">
          Redirecting to sign in automatically in <span className="font-bold text-blue-600">{countdown}s</span>...
        </div>

        <div className="pt-2">
          <Link
            href="/signin"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-sm"
          >
            <span>Sign In Now</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // 4. Password Reset Form State
  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <KeyRound size={20} />
        </div>
        <h2 className="text-[26px] font-semibold text-slate-900">
          Create new password
        </h2>
        <p className="mt-1.5 text-[13px] text-slate-500">
          Choose a secure, strong password for your audit account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-slate-700">
            New password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              minLength={8}
              required
              autoFocus
              autoComplete="new-password"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Strength Meter Bar */}
        {newPassword && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Password strength:</span>
              <span className={`font-semibold ${strengthLabel.text}`}>{strengthLabel.label}</span>
            </div>
            <div className="flex h-1.5 w-full gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    step <= strengthScore ? strengthLabel.color : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-slate-700">
            Confirm new password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              required
              autoComplete="new-password"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Password Requirements Checklist */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-2">
          <p className="text-[11px] font-medium text-slate-700">Password must include:</p>
          <div className="grid grid-cols-1 gap-1 text-[11px]">
            <div className={`flex items-center gap-1.5 ${criteria.minLength ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
              {criteria.minLength ? <Check size={13} className="text-emerald-600 shrink-0" /> : <X size={13} className="text-slate-400 shrink-0" />}
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${criteria.hasUpper ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
              {criteria.hasUpper ? <Check size={13} className="text-emerald-600 shrink-0" /> : <X size={13} className="text-slate-400 shrink-0" />}
              <span>Uppercase letter (A-Z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${criteria.hasLower ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
              {criteria.hasLower ? <Check size={13} className="text-emerald-600 shrink-0" /> : <X size={13} className="text-slate-400 shrink-0" />}
              <span>Lowercase letter (a-z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${criteria.hasNumberOrSymbol ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
              {criteria.hasNumberOrSymbol ? <Check size={13} className="text-emerald-600 shrink-0" /> : <X size={13} className="text-slate-400 shrink-0" />}
              <span>Number or symbol (0-9, @#$...)</span>
            </div>
            {confirmPassword && (
              <div className={`flex items-center gap-1.5 ${criteria.passwordsMatch ? "text-emerald-700 font-medium" : "text-rose-600"}`}>
                {criteria.passwordsMatch ? <Check size={13} className="text-emerald-600 shrink-0" /> : <X size={13} className="text-rose-500 shrink-0" />}
                <span>Passwords match</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <p className="text-[11px] font-medium text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !criteria.minLength || !criteria.passwordsMatch}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-[13px] font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </button>

        <div className="text-center pt-1">
          <Link
            href="/signin"
            className="text-[12px] text-slate-500 hover:text-slate-800 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="fixed inset-0 z-[100] flex min-h-screen bg-white">
      {/* Left branding panel */}
      <div className="hidden w-[46%] flex-col justify-between bg-[#0f172a] p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <ShieldCheck size={23} />
            </div>
            <div>
              <p className="text-[16px] font-semibold">Audit Platform</p>
              <p className="text-[10px] text-slate-400">Cybersecurity GRC</p>
            </div>
          </div>
          <div className="mt-24 max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400">
              Governance • Risk • Compliance
            </p>
            <h1 className="mt-5 text-[42px] font-semibold leading-[1.1] tracking-tight">
              Create New<br />Password.
            </h1>
            <p className="mt-6 max-w-md text-[14px] leading-6 text-slate-400">
              Establish a new, strong password to regain access to your cybersecurity audit environment.
            </p>
          </div>
        </div>
        <div className="text-[10px] text-slate-500">
          Audit Platform • Security & Compliance Management
        </div>
      </div>

      {/* Main reset form panel */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[420px]">
          {/* Mobile branding */}
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-slate-900">Audit Platform</p>
                <p className="text-[10px] text-slate-400">Cybersecurity GRC</p>
              </div>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <Loader2 size={36} className="animate-spin text-blue-600" />
                <p className="text-xs text-slate-500">Loading security parameters...</p>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

          <p className="mt-8 text-center text-[10px] text-slate-400">
            Secure access to your organization&apos;s audit environment
          </p>
        </div>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
