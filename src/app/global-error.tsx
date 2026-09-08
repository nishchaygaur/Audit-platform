"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6f8fc] flex items-center justify-center p-4">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <h2 className="text-base font-semibold text-slate-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
