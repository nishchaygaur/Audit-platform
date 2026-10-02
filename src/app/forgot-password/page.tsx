"use client";

import { FormEvent, useState } from "react";
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setLoading(false);

      if (res?.error) {
        setError(res.error);
      } else {
        setMessage(
          res?.message ||
            `If an account exists for ${cleanEmail}, a secure password reset link has been sent. Please check your inbox.`
        );
        setSuccess(true);
      }
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    }
  }

  function handleResetAnother() {
    setSuccess(false);
    setMessage("");
    setError("");
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
              Account Recovery • Access Verification
            </p>
            <h1 className="mt-5 text-[42px] font-semibold leading-[1.1] tracking-tight">
              Reset Your<br />Credentials.
            </h1>
            <p className="mt-6 max-w-md text-[14px] leading-6 text-slate-400">
              Securely restore access to your compliance artifacts, audit evidence vaults, and enterprise security control frameworks.
            </p>
          </div>
        </div>
        <div className="text-[10px] text-slate-500">
          Audit Platform • Security & Compliance Management
        </div>
      </div>

      {/* Main content panel */}
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

          <div className="mb-7">
            <Link
              href="/signin"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition mb-6"
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>

            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <KeyRound size={20} />
            </div>
            <h2 className="text-[27px] font-semibold text-slate-900">
              Forgot password?
            </h2>
            <p className="mt-2 text-[13px] text-slate-500">
              Enter the email associated with your account and we will send you a link to reset your password.
            </p>
          </div>

          {success ? (
            <div className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-slate-900">Reset Link Sent</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-100/60 p-3 text-left">
                <p className="text-[11px] text-emerald-900 font-medium">Next steps:</p>
                <ul className="mt-1 list-disc pl-4 text-[11px] text-emerald-800 space-y-0.5">
                  <li>Open the email sent from our system.</li>
                  <li>Click the enclosed secure reset link within 1 hour.</li>
                  <li>If you don&apos;t see the message, check your spam folder.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/signin"
                  className="flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  Return to Sign In
                </Link>
                <button
                  type="button"
                  onClick={handleResetAnother}
                  className="text-xs text-slate-500 hover:text-slate-800 py-1 transition"
                >
                  Send to a different email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <p className="text-[11px] font-medium text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-[13px] font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/signin"
                  className="text-[12px] text-slate-500 hover:text-slate-800 transition"
                >
                  Remember your password? <span className="font-semibold text-blue-600 hover:text-blue-700">Sign in</span>
                </Link>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-[10px] text-slate-400">
            Secure access to your organization&apos;s audit environment
          </p>
        </div>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
