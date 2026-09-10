"use client";

import { FormEvent, useState } from "react";
import { ShieldCheck, Eye, EyeOff, Lock, CheckCircle2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/actions/auth";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await updatePassword(newPassword);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/signin");
      }, 2500);
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
              Reset Your<br />Password.
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
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <KeyRound size={20} />
            </div>
            <h2 className="text-[27px] font-semibold text-slate-900">
              Set new password
            </h2>
            <p className="mt-2 text-[13px] text-slate-500">
              Enter your new password below. It must be at least 8 characters.
            </p>
          </div>

          {success ? (
            <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Password Updated</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Your password has been successfully updated. Redirecting to sign in...
                </p>
              </div>
              <Link
                href="/signin"
                className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Click here to sign in now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-700">
                  New password (min 8 characters)
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
                    autoComplete="new-password"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-700">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-[13px] font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating password..." : "Update Password"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/signin"
                  className="text-[12px] text-slate-500 hover:text-slate-800"
                >
                  Back to Sign In
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
