"use client";
import { FormEvent, useState, useEffect } from "react";
import { ShieldCheck, Eye, EyeOff, Lock, Mail, User, X, CheckCircle2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn, requestPasswordReset } from "@/actions/auth";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export default function SignInPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Forgot password dialog state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Check URL query parameters and hash fragment for callback errors
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith("#") ? window.location.hash.substring(1) : "";
      const hashParams = new URLSearchParams(hash);

      const errCode = params.get("error_code") || hashParams.get("error_code") || params.get("error") || hashParams.get("error");
      const errDesc = params.get("error_description") || hashParams.get("error_description");

      if (errCode || errDesc) {
        const lowerCode = (errCode || "").toLowerCase();
        const lowerDesc = (errDesc || "").toLowerCase();

        if (
          lowerCode === "otp_expired" ||
          lowerCode === "access_denied" ||
          lowerCode.includes("expired") ||
          lowerDesc.includes("expired") ||
          lowerDesc.includes("invalid")
        ) {
          setError("This confirmation link has expired or has already been used. Please request a new confirmation email.");
        } else if (
          lowerCode === "pkce_verifier_missing" ||
          lowerCode.includes("verifier") ||
          lowerDesc.includes("verifier") ||
          lowerDesc.includes("pkce")
        ) {
          setInfoMessage("Email confirmed! If you opened the verification link on a different browser or device, please sign in with your email and password.");
        } else if (lowerCode === "user_resolution_failed") {
          setError("Unable to setup your user account. Please contact support or try signing in again.");
        } else if (lowerCode === "auth_callback_failed") {
          setError("Authentication failed or the verification link is invalid. Please try signing in or request a new confirmation email.");
        } else {
          setError(errDesc || "Authentication error. Please try signing in again.");
        }

        // Clean the address bar to remove error query and fragment
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }
    }

    if (!authLoading && user) {
      router.push("/workspaces");
    }
  }, [user, authLoading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfoMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedPassword || (isSignUp && !trimmedName)) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isSignUp) {
      const isGmail = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i.test(trimmedEmail);
      if (!isGmail) {
        setError("Registration requires a valid Gmail address (@gmail.com or @googlemail.com).");
        return;
      }
      if (trimmedPassword.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      setLoading(true);

      try {
        const supabase = createBrowserClient();
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: { name: trimmedName },
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        // Supabase returns empty identities array when email is already registered and email confirmation is on
        if (data.user?.identities && data.user.identities.length === 0) {
          setError("Email is already registered");
          setLoading(false);
          return;
        }

        if (!data.session) {
          setInfoMessage("Account created. Please check your email and verify your account before signing in.");
          setLoading(false);
          setIsSignUp(false);
          return;
        }

        // Auto-confirmed in dev environment: synchronize session and app user
        const formData = new FormData();
        formData.append("email", trimmedEmail);
        formData.append("password", trimmedPassword);
        const signInResult = await signIn(formData);
        if (signInResult?.error) {
          setError(signInResult.error);
          setLoading(false);
        } else {
          router.refresh();
          router.push("/workspaces");
        }
      } catch (err) {
        console.error("[SignIn] Error during registration:", err);
        setError("An error occurred during registration. Please try again.");
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("email", trimmedEmail);
    formData.append("password", trimmedPassword);

    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
      router.push("/workspaces");
    }
  }

  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetMessage("");
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address.");
      return;
    }
    setResetLoading(true);
    const res = await requestPasswordReset(resetEmail.trim());
    setResetLoading(false);
    if (res.success) {
      setResetSuccess(true);
      setResetMessage(
        res.message ||
          "If an account exists for this email, a password reset link has been sent. Please check your inbox."
      );
    } else {
      setResetError(res.error || "Failed to request password reset.");
    }
  }

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
              Manage audits.<br />Assess controls.<br />Reduce risk.
            </h1>
            <p className="mt-6 max-w-md text-[14px] leading-6 text-slate-400">
              A centralized platform for managing cybersecurity audits, frameworks, evidence, findings, risks and remediation activities.
            </p>
          </div>
        </div>
        <div className="text-[10px] text-slate-500">
          Audit Platform • Security & Compliance Management
        </div>
      </div>
      
      {/* Sign in / Sign up form panel */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[410px]">
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
          
          <div className="mb-7">
            <h2 className="text-[27px] font-semibold text-slate-900">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-[13px] text-slate-500">
              {isSignUp ? "Sign up to start your audit workspace." : "Sign in to continue to your audit workspace."}
            </p>
          </div>

          {infoMessage && (
            <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <p className="text-[12px] font-medium leading-5 text-blue-900">{infoMessage}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name - only for sign up */}
            {isSignUp && (
              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-700">
                  Full name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            )}
            
            {/* Email */}
            <div>
              <label className="mb-2 block text-[11px] font-medium text-slate-700">
                Email address {isSignUp && <span className="text-slate-400 font-normal">(@gmail.com only)</span>}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            
            {/* Password */}
            <div>
              <label className="mb-2 block text-[11px] font-medium text-slate-700">
                Password {isSignUp && <span className="text-slate-400 font-normal">(min 8 characters)</span>}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Create a password (min 8 chars)" : "Enter your password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={isSignUp ? 8 : undefined}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            {/* Options */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-500">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || "");
                    setResetError("");
                    setResetMessage("");
                    setResetSuccess(false);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>
            )}
            
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-[11px] font-medium text-red-600">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-[13px] font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Create Account" : "Sign In")}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setInfoMessage("");
              }}
              className="text-[12px] text-slate-500 hover:text-slate-800"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
          
          <p className="mt-8 text-center text-[10px] text-slate-400">
            Secure access to your organization&apos;s audit environment
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4">
          <div data-testid="forgot-password-modal" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Reset your password
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter your email to receive a password reset link
                  </p>
                </div>
              </div>

              <button
                data-testid="close-forgot-password-button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {resetSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-slate-900">Reset Link Sent</h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                    {resetMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      data-testid="forgot-password-email-input"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    />
                  </div>
                </div>

                {resetError && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                    {resetError}
                  </p>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {resetLoading ? "Sending Link..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export const dynamic = 'force-dynamic';
