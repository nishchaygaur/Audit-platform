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
      <head>
        <title>Error</title>
      </head>
      <body>
        <div>
          <h2>Something went wrong</h2>
          <p>{error?.digest || "An unexpected error occurred."}</p>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}


