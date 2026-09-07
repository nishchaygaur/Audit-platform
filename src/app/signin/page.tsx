"use client";

import { FormEvent, useState } from "react";
import { ShieldCheck, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    /*
     * Frontend demo authentication.
     * Replace this section with your real authentication API later.
     */
    window.setTimeout(() => {
      localStorage.setItem("audit_authenticated", "true");
      localStorage.setItem(
        "audit_user",
        JSON.stringify({
          name: "Admin User",
          email: email.trim(),
          role: "Administrator",
        })
      );

      if (rememberMe) {
        localStorage.setItem("audit_remember_me", "true");
      } else {
        localStorage.removeItem("audit_remember_me");
      }

      router.push("/workspaces");
    }, 500);
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
              <p className="text-[16px] font-semibold">
                Audit Platform
              </p>

              <p className="text-[10px] text-slate-400">
                Cybersecurity GRC
              </p>
            </div>
          </div>

          <div className="mt-24 max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400">
              Governance • Risk • Compliance
            </p>

            <h1 className="mt-5 text-[42px] font-semibold leading-[1.1] tracking-tight">
              Manage audits.
              <br />
              Assess controls.
              <br />
              Reduce risk.
            </h1>

            <p className="mt-6 max-w-md text-[14px] leading-6 text-slate-400">
              A centralized platform for managing cybersecurity
              audits, frameworks, evidence, findings, risks and
              remediation activities.
            </p>
          </div>
        </div>

        <div className="text-[10px] text-slate-500">
          Audit Platform • Security & Compliance Management
        </div>
      </div>

      {/* Sign in */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[410px]">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ShieldCheck size={22} />
              </div>

              <div>
                <p className="text-[17px] font-semibold text-slate-900">
                  Audit Platform
                </p>

                <p className="text-[10px] text-slate-400">
                  Cybersecurity GRC
                </p>
              </div>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-[27px] font-semibold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-[13px] text-slate-500">
              Sign in to continue to your audit workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-[11px] font-medium text-slate-700">
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-[11px] font-medium text-slate-700">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span className="text-[11px] text-slate-500">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() =>
                  alert(
                    "Password recovery will be connected to the authentication backend."
                  )
                }
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-[11px] font-medium text-red-600">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-[13px] font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-slate-400">
            Secure access to your organization&apos;s audit environment
          </p>
        </div>
      </div>
    </main>
  );
}